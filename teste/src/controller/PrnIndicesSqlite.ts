import { SQLite } from "../database/DAO";
// import { trackPromises } from "../utils/trackPromises";
import { PrnIndicesController } from "./PrnIndicesController";
import logger from "../logger";

export class PrnIndicesSqlite extends PrnIndicesController {
    private dao: SQLite;

    constructor(dao: SQLite) {
        super();
        this.dao = dao;
    }

    public async createTable() {
        logger.log("Criando prnindices");
        const sql = `
			CREATE TABLE IF NOT EXISTS prnindices (
				prn INTEGER,
				mediasnr REAL,
				mediaazi REAL,
				mediaelev REAL,
				tinicial TEXT,
				tfinal TEXT,
				dpsnr REAL,
				s4 REAL
			)
		`;

        const promise = this.dao.run(sql);

        return promise;
    }

    insertProcessedData(dpSnr: number, s4: number, time: Date, prn: number) {
        const promise = this.dao.run(
            "INSERT INTO prnindices (prn, mediasnr, mediaazi, mediaelev, tinicial, tfinal, dpsnr, s4) SELECT prn, AVG(snr), AVG(azi), AVG(elev), min(time), max(time), ?, ? from prninfo where time between ?-60000 and ? and prn = ? group by prn",
            [dpSnr, s4, time, time, prn],
        );

        return promise;
    }

    async indicesLength(): Promise<number> {
        const sql = "SELECT COUNT(*) as total FROM prnindices";

        const res: any = await this.dao.get(sql);

        return res.total;
    }
}
