import { PrnInfoController } from "../controller/PrnInfoController";
import { SQLite } from "../database/DAO";
import logger from "../logger";
import { CustomData } from "../services/processData";

export class PrnInfoBetterSqlite extends PrnInfoController {
    private dao: SQLite;

    /**
     * @description Construtor com injeção do DAO Sqlite
     */
    constructor(dao: SQLite) {
        super();
        this.dao = dao;
    }

    /**
     * @description Cria a tabela prninfo se ela não existir
     */
    async createTable() {
        logger.log("Criando prninfo");
        const sql = `
			CREATE TABLE IF NOT EXISTS prninfo (
				prn INTEGER,
				snr REAL,
				azi REAL,
				elev REAL,
				lat REAl,
				long REAL,
				time TEXT
			)
		`;

        return this.dao.run(sql);
    }

    insert(
        prn: number,
        snr: number,
        azimuth: number,
        elevation: number,
        lat: number,
        lon: number,
        time: Date,
    ) {
        return this.dao.run(
            "INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES(?,?,?,?,?,?,?)",
            [prn, snr, azimuth, elevation, lat, lon, time.getTime()],
        );
    }

    insertMany(data: CustomData[]) {
        const placeholder = data
            .map(
                (cd) =>
                    `(${cd.prn},${cd.snr},${cd.azi},${cd.elev},${cd.lat},${cd.lon},${cd.time.getTime()})`,
            )
            .join(",");
        const query =
            "INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES " +
            placeholder;
        return this.dao.run(query);
    }

    /**
     * @description Retorna dados inseridos em prninfo agrupados em um intervalo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     */
    public getGroupedPrn(time: Date): Promise<any> {
        return this.dao.all(
            "select prn, count(snr) as total from prninfo where time between ?-60000 and ? group by prn",
            [time.getTime(), time.getTime()],
        );
    }

    /**
     * @description Seleciona prn e snr de determinado prn em um periodo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     * @param prn informa de qual prn será realizado a filtragem
     */
    public getByPrn(time: Date, prn: number): Promise<any> {
        return this.dao.all(
            "SELECT prn, snr FROM prninfo WHERE time BETWEEN ?-60000 AND ? AND prn = ?",
            [time.getTime(), time.getTime(), prn],
        );
    }

    async infoLength(): Promise<number> {
        const sql = "SELECT COUNT(*) as total FROM prninfo";

        const res: any = await this.dao.get(sql);

        return res.total;
    }
}
