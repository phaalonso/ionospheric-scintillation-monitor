import { SQLite } from "../database/DAO";
import { PrnInfoController } from "./PrnInfoController";
import logger from "../logger";
//import { trackPromises } from "../utils/trackPromises";
import { CustomData } from "../services/processData";

export class PrnInfoSqlite extends PrnInfoController {
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
        const promise = this.dao.run(
            "INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES(?,?,?,?,?,?,?)",
            [prn, snr, azimuth, elevation, lat, lon, time],
        );

        return promise;
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
        const promise = this.dao.all(
            "select prn, count(snr) as total from prninfo where time between ?-60000 and ? group by prn",
            [time, time],
        );

        return promise;
    }

    /**
     * @description Seleciona prn e snr de determinado prn em um periodo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     * @param prn informa de qual prn será realizado a filtragem
     */
    public getByPrn(time: Date, prn: number): Promise<any> {
        const promise = this.dao.all(
            "SELECT prn, snr FROM prninfo WHERE time BETWEEN ?-60000 AND ? AND prn = ?",
            [time, time, prn],
        );

        return promise;
    }

    async infoLength(): Promise<number> {
        const sql = "SELECT COUNT(*) as total FROM prninfo";

        const res: any = await this.dao.get(sql);

        return res.total;
    }
}
