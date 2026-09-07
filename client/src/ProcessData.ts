import { mean, std } from "mathjs";
import { Satellite } from "gps";
import logger from "./logger";
import { IPrnIndicesController, IPrnInfoController } from "./controller";
import config from "./config/ConfigProvider";
import { SignalMetrics } from "./model/SignalMetrics";

const TAXA = 0.1;
const DISP = 0.5;
const MIN_QTDE = (60 / TAXA) * DISP;

export class ProcessData {
    private timeController!: Date;
    private buffer: SignalMetrics[];

    private readonly interval: number;
    private readonly maxCounter: number;
    private readonly logInterval: number;

    private counter: number;

    constructor(
        private readonly prnInfoController: IPrnInfoController,
        private readonly prnIndicesController: IPrnIndicesController
    ) {
        const processConfig = config.get('process');

        logger.log('Iniciando ProcessData');

        this.interval = processConfig.interval;
        this.logInterval = processConfig.logInterval;

        this.buffer = [];
        this.counter = 0;
        this.maxCounter = 60000 / this.interval;

        logger.log(`Intervalo entre as inserções na base de dados: ${this.interval / 1000} segundos`);
        logger.log(`Counter máximo entre as inserções: (60000 / ${this.interval}) = ${this.maxCounter}`);

        this.setupProcess(this.interval);
    }

    public async logDBSize() {
        const prninfoLength = await this.prnInfoController.countRows();
        const prnindicesLength = await this.prnIndicesController.indicesLength();

        // logger.log(`Quantidade de  dados ${qtd}`);
        logger.log(`prninfo rowCount: ${prninfoLength}`);
        logger.log(`prnindices rowCount: ${prnindicesLength}`);
    }

    private setupProcess(interval: number): NodeJS.Timeout {
        const processInterval = async () => {
            if (this.buffer.length == 0) {
                logger.log('Buffer vazio');
                return;
            }

            const clone = [...this.buffer];

            await this.prnInfoController.insertMany(clone);
            logger.log(`Prninfo: inserted ${clone.length} data`);
            this.buffer = [];
            this.counter++;

            if (this.counter >= this.maxCounter) {
                //console.log(this.counter);
                this.counter = 0;
                this.processMinute();

                const timestamp = this.timeController.getTime()
                this.timeController = new Date(timestamp + 60000);
            }
        }

        return setInterval(
            processInterval,
            interval
        );
    }

    /**
     * @description função utilizada para inserir dados no DB assim que estes forem recebidos
     * @deprecated
     */
    public async processData(
        satellite: Satellite[],
        lat: number,
        lon: number,
        time: Date
    ) {
        if (!this.timeController) {
            this.timeController = time;
        }

        for (const satelite of satellite) {
            await this.prnInfoController.insert({
                prn: satelite.prn,
                snr: satelite.snr,
                azi: satelite.azimuth,
                elev: satelite.elevation,
                lat,
                lon,
                time,
            });
        }

        if (this.oneMinuteSinceLastProcess(time, this.timeController)) {
            logger.log(`${time} storing prn indices\n`);
            this.timeController = time;
            await this.processMinute();
        }
    }

    public oneMinuteSinceLastProcess(time: Date, lastTime: Date): boolean {
        return time.getMinutes() > lastTime.getMinutes() || time.getHours() > lastTime.getHours();
    }

    public async processMinute() {
        try {
            logger.log(`storing prn indices for ${this.timeController.toISOString()}!`)

            const prnResultSize = await this.prnInfoController.groupByPrn(this.timeController);

            logger.log(`processing ${prnResultSize.length} lines`);

            for (const prnRow of prnResultSize) {
                if (prnRow.total < MIN_QTDE) {
                    logger.log(`prn ${prnRow.prn} has less than ${MIN_QTDE} samples at ${this.timeController.toISOString()}!`);
                    continue;
                }

                let vectorRawSnr: number[] = [];
                let vectorSnrInLinearRatio: number[] = [];
                try {
                    const prnData = await this.prnInfoController.findByPrn(this.timeController, prnRow.prn);

                    for (const { snr } of prnData) {
                        if (!snr) {
                            continue;
                        }

                        vectorRawSnr.push(snr);

                        // convert snr to linear ratio
                        vectorSnrInLinearRatio.push(Math.pow(10, snr / 10));
                    }

                    if (vectorRawSnr.length == 0) {
                        logger.log("vSnr vazio");
                        continue;
                    }

                    const dpSnr = Number(std(vectorRawSnr));
                    const s4Total = this.totalS4(vectorSnrInLinearRatio);
                    const s4Noise = this.noiseS4(vectorSnrInLinearRatio);
                    const s4 = Math.sqrt(
                        Math.max(0, s4Total ** 2 - s4Noise ** 2)
                    );

                    logger.log(`Inserting prnindice`);
                    await this.prnIndicesController.insertProcessedData(
                        dpSnr,
                        s4,
                        this.timeController,
                        prnRow.prn
                    );
                } catch (err: any) {
                    console.log(err);
                    logger.exception(err);
                }
            }
        } catch (err: any) {
            logger.exception(err);
            process.exit(1);
        }
    }

    /**
     * @description Fits the least-squares linear trend of `values` and
     * returns the fitted value for each sample index.
     */
    private linearTrend(values: number[]): number[] {
        const n = values.length;

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }

        const denominator = n * sumXX - sumX * sumX;
        const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
        const intercept = (sumY - slope * sumX) / n;

        return values.map((_, i) => intercept + slope * i);
    }

    /**
     * @description Total S4 (S4_T): normalized standard deviation of the
     * signal intensity. The intensity is first detrended by dividing by its
     * least-squares linear trend, keeping the series positive and its mean
     * normalized to ~1.
     * S4_T = sqrt((<SI^2> - <SI>^2) / <SI>^2)
     */
    private totalS4(intensities: number[]): number {
        const trend = this.linearTrend(intensities);
        const detrended = intensities.map((value, i) =>
            trend[i] !== 0 ? value / trend[i] : value
        );

        const meanIntensity = mean(detrended);
        const meanIntensitySquared = meanIntensity ** 2;
        const meanOfSquares = mean(detrended.map(value => value ** 2));

        return Math.sqrt(
            Math.max(0, (meanOfSquares - meanIntensitySquared) / meanIntensitySquared)
        );
    }

    /**
     * @description Noise S4 (S4_N): amplitude fluctuations caused strictly by
     * ambient noise, estimated from the average linear signal-to-noise
     * density ratio over the interval: S4_N^2 = 100 / SNR.
     */
    private noiseS4(intensities: number[]): number {
        const meanSnrLinear = mean(intensities);

        return Math.sqrt(100 / meanSnrLinear);
    }

    /**
     * @description acumulate data in buffer to be processed later
     */
    async sendToBuffer(custom: SignalMetrics) {
        if (!this.timeController) {
            this.timeController = custom.time;
        }

        this.buffer.push(custom);
    }
}
