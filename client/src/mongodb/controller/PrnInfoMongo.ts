import {
    AmountOfSNRPerPRN,
    FindByRPNResult,
    IPrnInfoController,
} from "../../controller";
import { SignalMetrics } from "../../model/SignalMetrics";
import logger from "../../logger";
import { PrnInfoModel } from "../database/prninfo";

export class PrnInfoMongo implements IPrnInfoController {
    public async insert(metric: SignalMetrics) {
        return new PrnInfoModel(metric).save().catch((err) => {
            logger.exception(err, "On insert prninfo mongo");
        });
    }

    insertMany(data: SignalMetrics[]) {
        return PrnInfoModel.insertMany(data);
    }

    /**
     * @description Retorna dados inseridos em prninfo agrupados num intervalo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     */
    public groupByPrn(time: Date): Promise<AmountOfSNRPerPRN[]> {
        //console.log('Get gropuped prn');
        return PrnInfoModel.aggregate()
            .match({
                time: {
                    $lte: time,
                    $gt: new Date(time.getTime() - 60000),
                },
            })
            .group({
                _id: "$prn",
                total: { $sum: 1 },
            })
            .project({
                _id: false,
                prn: "$_id",
                total: true,
            })
            .exec();
    }

    /**
     * @description Seleciona prn e snr de determinado prn num periodo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     * @param prn informa de qual prn será realizado a filtragem
     */
    public findByPrn(time: Date, prn: number): Promise<FindByRPNResult[]> {
        //return this.dao.all(
        //'SELECT prn, snr FROM prninfo WHERE time BETWEEN ?-60000 AND ? AND prn = ?',
        //[time, time, prn]
        //);
        return PrnInfoModel.find({
            prn: prn,
            time: {
                $lte: time,
                $gt: new Date(time.getTime() - 1000 * 60),
            },
        });
    }

    countRows(): Promise<number> {
        return new Promise((res, rej) => {
            PrnInfoModel.countDocuments()
                .then((count) => res(count))
                .catch((err) => rej(err));
        });
    }

    async deleteBefore(lastDateTime: Date): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
