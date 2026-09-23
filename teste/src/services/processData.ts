import { std, mean } from "mathjs";
import { Satellite } from "gps";
import logger from "../logger";
import { PrnInfoController } from "../controller/PrnInfoController";
import { PrnIndicesController } from "../controller/PrnIndicesController";

export interface CustomData {
    prn: number;
    snr: number;
    azi: number;
    elev: number;
    lat: number;
    lon: number;
    time: Date;
}

const TAXA = 0.1;
const DISP = 0.5;
const MIN_QTDE = (60 / TAXA) * DISP;

export class ProcessData {
    private timeController: number;
    private prnInfo: PrnInfoController;
    private prnIndices: PrnIndicesController;
    private qtdDados = 0;

    constructor(
        prnInfoController: PrnInfoController,
        prnIndicesController: PrnIndicesController,
    ) {
        if (!prnInfoController || !prnIndicesController) {
            throw new Error("You need to pass the controllers to ProcessData");
        }

        this.prnIndices = prnIndicesController;
        this.prnInfo = prnInfoController;

        setInterval(
            async ([prnIndices, prnInfo, qtd]: [
                PrnIndicesController,
                PrnInfoController,
                number,
            ]) => {
                const prninfoLength = await prnInfo.infoLength();
                const prnindicesLength = await prnIndices.indicesLength();

                logger.log(`Quantidade de  dados ${qtd}`);
                logger.log(`Prninfo: ${prninfoLength}`);
                logger.log(`Prnindices: ${prnindicesLength}`);
            },
            1000 * 60 * 30,
            [prnIndicesController, prnInfoController, this.qtdDados],
        );
    }

    public async processData(
        satellite: Satellite[],
        lat: number,
        lon: number,
        time: Date,
    ) {
        if (!this.timeController) {
            this.timeController = time.getMinutes();
        }

        for (const satelite of satellite) {
            await this.prnInfo.insert(
                satelite.prn,
                satelite.snr,
                satelite.azimuth,
                satelite.elevation,
                lat,
                lon,
                time,
            );
        }

        if (
            time.getSeconds() == 0 &&
            time.getMinutes() != this.timeController
        ) {
            process.stdout.write(`${time} Salvando prnindices\n`);
            this.timeController = time.getMinutes();

            await this.processMinute(time);
        }
    }

    public async processMinute(time: Date) {
        //logger.log(`Prossesing prnidices from ${time.toLocaleString('pt-br')}`);

        const rows = await this.prnInfo.getGroupedPrn(time);

        //logger.log("PrninfoGrouped", rows);
        for (const row of rows) {
            //logger.log(row)
            if (row.total >= MIN_QTDE) {
                let vSnr = [];
                let vIntensidadeSinal = [];
                let intensidadeSinalQuadrado = 0;
                let intensidade = 0;

                try {
                    const prnData = await this.prnInfo.getByPrn(time, row.prn);
                    //logger.log('Prn info by binute', prnData[0]);

                    prnData.forEach((row) => {
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

                    //logger.log("S4", s4);
                    this.prnIndices.insertProcessedData(
                        dpSnr,
                        s4,
                        time,
                        row.prn,
                    );
                } catch (err) {
                    logger.exception(err);
                }
            }
        }
    }

    async processCustomData(custom: CustomData) {
        if (!this.timeController) {
            this.timeController = custom.time.getMinutes();
        }

        await this.prnInfo.insert(
            custom.prn,
            custom.snr,
            custom.azi,
            custom.elev,
            custom.lat,
            custom.lon,
            custom.time,
        );

        if (
            custom.time &&
            custom.time.getSeconds() == 0 &&
            custom.time.getMinutes() != this.timeController
        ) {
            this.timeController = custom.time.getMinutes();
            logger.log(this.timeController);

            await this.processMinute(custom.time);
        }
    }
}
