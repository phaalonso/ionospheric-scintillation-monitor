import { IPrnIndicesController } from "../../controller/IPrnIndicesController";
import logger from "../../logger";
import { SQLite } from "../database/DAO";

export class PrnIndicesBetterSqlite implements IPrnIndicesController {
    constructor(private dao: SQLite) {}

    public async createTable() {
        logger.log("Criando prnindices");
        const sql = `
			CREATE TABLE IF NOT EXISTS prnindices (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				prn INTEGER NOT NULL,
				mediasnr REAL,
				mediaazi REAL,
				mediaelev REAL,
				tinicial TEXT NOT NULL,
				tfinal TEXT NOT NULL,
				dpsnr REAL,
				s4 REAL NOT NULL
			)
		`;

        return this.dao.run(sql);
    }

    insertProcessedData(dpSnr: number, s4: number, time: Date, prn: number) {
        return this.dao.run(
            "INSERT INTO prnindices (prn, mediasnr, mediaazi, mediaelev, tinicial, tfinal, dpsnr, s4) SELECT prn, AVG(snr), AVG(azi), AVG(elev), min(time), max(time), ?, ? from prninfo where time between datetime(?, '-1 minute') and datetime(?) and prn = ? group by prn",
            [dpSnr, s4, time.toISOString(), time.toISOString(), prn],
        );
    }

    async indicesLength(): Promise<number> {
        const sql = "SELECT COUNT(*) as total FROM prnindices";

        const res: any = await this.dao.get(sql);

        return res.total;
    }

    async lastIndice(): Promise<Date | undefined> {
        const sql =
            "SELECT tfinal FROM prnindices ORDER BY tfinal DESC LIMIT 1;";

        const res: any = await this.dao.get(sql);

        if (res) return new Date(res.tfinal);
        return undefined;
    }

    async deleteBefore(lastDateTime: Date): Promise<void> {
        const sql = "DELETE FROM prnindices WHERE tfinal <= ?";
        const stmt = this.dao.con.prepare(sql);

        const res = stmt.run(lastDateTime.toISOString());

        logger.log(`Removed ${res.changes} rows from PrnIndices`);
    }
}
