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
        private readonly prnIndicesController: IPrnIndicesController,
    ) {
        const processConfig = config.get("process");

        logger.log("Iniciando ProcessData");

        this.interval = processConfig.interval;
        this.logInterval = processConfig.logInterval;

        this.buffer = [];
        this.counter = 0;
        this.maxCounter = 60000 / this.interval;

        logger.log(
            `Intervalo entre as inserções na base de dados: ${this.interval / 1000} segundos`,
        );
        logger.log(
            `Counter máximo entre as inserções: (60000 / ${this.interval}) = ${this.maxCounter}`,
        );

        this.setupDBSizeLog(this.logInterval);
        this.setupProcess(this.interval);
    }

    /**
     * @param interval interval in ms to log the database size
     */
    private setupDBSizeLog(interval: number): NodeJS.Timeout {
        const logDbSize = async () => {
            const prninfoLength = await this.prnInfoController.countRows();
            const prnindicesLength =
                await this.prnIndicesController.indicesLength();

            // logger.log(`Quantidade de  dados ${qtd}`);
            logger.log(`Prninfo: ${prninfoLength}`);
            logger.log(`Prnindices: ${prnindicesLength}`);
        };

        return setInterval(logDbSize, interval);
    }

    private setupProcess(interval: number): NodeJS.Timeout {
        const processInterval = async () => {
            if (this.buffer.length == 0) {
                logger.log("Buffer vazio");
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

                const timestamp = this.timeController.getTime();
                this.timeController = new Date(timestamp + 60000);
            }
        };

        return setInterval(processInterval, interval);
    }

    /**
     * @description função utilizada para inserir dados no DB assim que estes forem recebidos
     * @deprecated
     */
    public async processData(
        satellite: Satellite[],
        lat: number,
        lon: number,
        time: Date,
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

        if (this.passouUmMinuto(time)) {
            logger.log(`${time} Salvando prnindices\n`);
            this.timeController = time;
            await this.processMinute();
        }
    }

    public passouUmMinuto(time: Date): boolean {
        return (
            time.getMinutes() > this.timeController.getMinutes() ||
            time.getHours() > this.timeController.getHours()
        );
    }

    public async processMinute() {
        try {
            logger.log(
                `salvando prnindices relacionado a ${this.timeController.toISOString()}!`,
            );

            const rows = await this.prnInfoController.groupByPrn(
                this.timeController,
            );

            logger.log(`Processing ${rows.length} prns`);

            //logger.log("PrninfoGrouped", rows);
            for (const row of rows) {
                //logger.log(row)
                if (row.total >= MIN_QTDE) {
                    let vSnr: number[] = [];
                    let vIntensidadeSinal: number[] = [];
                    let intensidadeSinalQuadrado = 0;
                    let intensidade = 0;

                    try {
                        const prnData = await this.prnInfoController.findByPrn(
                            this.timeController,
                            row.prn,
                        );
                        //logger.log('Prn info by minute', prnData[0]);

                        prnData.forEach((row: any) => {
                            if (row.snr) {
                                // logger.log(row.prn + " -->" + row.snr);
                                intensidade = Math.pow(10, row.snr / 10);
                                //logger.log(row.snr);
                                vSnr.push(row.snr);
                                vIntensidadeSinal.push(intensidade);
                                intensidadeSinalQuadrado += Math.pow(
                                    intensidade,
                                    2,
                                );
                            }
                        });

                        if (vSnr.length == 0) {
                            logger.log("vSnr vazio");
                            return;
                        }

                        let dpSnr = std(vSnr);
                        intensidadeSinalQuadrado /= vIntensidadeSinal.length;
                        let mediaIntensidadeSinalQuadrado = Math.pow(
                            mean(vIntensidadeSinal),
                            2,
                        );
                        let s4 = Math.sqrt(
                            (intensidadeSinalQuadrado -
                                mediaIntensidadeSinalQuadrado) /
                                mediaIntensidadeSinalQuadrado,
                        );

                        logger.log(`Inserting prnindice`);
                        await this.prnIndicesController.insertProcessedData(
                            dpSnr,
                            s4,
                            this.timeController,
                            row.prn,
                        );
                    } catch (err: any) {
                        console.log(err);
                        logger.exception(err);
                    }
                }
            }
        } catch (err: any) {
            logger.exception(err);
            process.exit(1);
        }
    }

    /**
     * @description Função responsável por enfilerar os dados no buffer, antes que sejam processados
     */
    async sendToBuffer(custom: SignalMetrics) {
        if (!this.timeController) {
            this.timeController = custom.time;
        }

        this.buffer.push(custom);
    }
}
