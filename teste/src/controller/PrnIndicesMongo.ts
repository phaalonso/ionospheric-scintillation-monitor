import { PrnIndicesController } from "../controller/PrnIndicesController";
import { IPrnIndices, PrnIndicesModel } from "../database/prnindices";
import logger from "../logger";
import { PrnInfoModel } from "../database/prninfo";

export class PrnIndicesMongo extends PrnIndicesController {
    async insertProcessedData(
        dpSnr: number,
        s4: number,
        time: Date,
        prn: number,
    ) {
        const minTime = new Date(time.getTime() - 1000 * 60);

        const [agregate] = await PrnInfoModel.aggregate([
            {
                $match: {
                    time: {
                        $lte: time,
                        $gt: minTime,
                    },
                    prn,
                },
            },
            {
                $group: {
                    _id: "$prn",
                    avgSnr: { $avg: "$snr" },
                    avgAzi: { $avg: "$azi" },
                    avgElev: { $avg: "$elev" },
                    minTime: { $min: "$time" },
                    maxTime: { $max: "$time" },
                },
            },
        ]).exec();

        const data: IPrnIndices = {
            prn,
            mediasnr: agregate.avgSnr,
            mediaazi: agregate.avgAzi,
            mediaelev: agregate.avgElev,
            minTime: minTime,
            maxTime: time,
            dpsnr: dpSnr,
            s4,
        };

        return (
            new PrnIndicesModel(data)
                .save()
                // .then(() => console.log('Saved prnindice'))
                .catch((err) => {
                    logger.exception(err, "On insert prnindices Mongo");
                })
        );
    }

    indicesLength(): Promise<number> {
        return new Promise((res, rej) => {
            PrnIndicesModel.countDocuments()
                .then((count) => res(count))
                .catch((err) => rej(err));
        });
    }
}
