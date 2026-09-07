import { AmountOfSNRPerPRN, FindByRPNResult, IPrnInfoController } from "../../controller/IPrnInfoController";
import { SQLite } from "../database/DAO";
import logger from "../../logger";
import { SignalMetrics } from "../../model/SignalMetrics";

export class PrnInfoBetterSqlite implements IPrnInfoController {
	constructor(
		private readonly dao: SQLite,
	) { }

	async createTable() {
		logger.info('Criando prninfo');
		const sql = `
			CREATE TABLE IF NOT EXISTS prninfo (
				id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
				time TEXT NOT NULL,
				prn INTEGER NOT NULL,
				snr REAL,
				azi REAL,
				elev REAL,
				lat REAl,
				long REAL
			)
		`;

		return this.dao.run(sql);
	}

	/**
	 * @description constrói parte da mensagem de inserção, para cada valor recebido
	 * @param data - Métricas do sinal
	 * @returns values com o formato necessário para inserção
	 */
	mapData(data: SignalMetrics[]) {
		return data.map(cd => (`(${cd.prn},${cd.snr},${cd.azi},${cd.elev},${cd.lat},${cd.lon},datetime('${cd.time.toISOString()}'))`)).join(',');
	}

	insert(metric: SignalMetrics) {
		const placeholder = this.mapData([metric]);
		return this.dao.run(
			'INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES ' + placeholder,
		);
	}

	insertMany(data: SignalMetrics[]) {
		const placeholder = this.mapData(data);
		return this.dao.run(
			'INSERT INTO prninfo (prn, snr, azi, elev, lat, long, time) VALUES ' + placeholder,
		);
	}

	/**
	 * @description Retorna dados inseridos em prninfo agrupados num intervalo de um minuto relativo ao parametro time
	 * @param time tempo será relativo a esse parametro
	 */
	public async groupByPrn(time: Date): Promise<AmountOfSNRPerPRN[]> {
		return this.dao.all(
			"select prn, count(snr) as total from prninfo where time between datetime(?, '-1 minute') and datetime(?) group by prn",
			[time.toISOString(), time.toISOString()]
		) as Promise<AmountOfSNRPerPRN[]>;
	}

	/**
	 * @description seleciona prn e snr de determinado prn num periodo de um minuto relativo ao parametro time
	 * @param time tempo será relativo a esse parametro
	 * @param prn informa de qual prn será realizado a filtragem
	 */
	public findByPrn(time: Date, prn: number): Promise<FindByRPNResult[]> {
		return this.dao.all(
			"SELECT prn, snr FROM prninfo WHERE time BETWEEN datetime(?, '-1 minute') AND datetime(?) AND prn = ?",
			[time.toISOString(), time.toISOString(), prn]
		) as Promise<FindByRPNResult[]>;
	}

	async countRows(): Promise<number> {
		const sql = "SELECT COUNT(*) as total FROM prninfo";

		const res: any = await this.dao.get(sql);

		return res.total;
	}

    async deleteBefore(lastDateTime: Date): Promise<void> {
		const sql = "DELETE FROM prninfo WHERE time <= ?";
		const stmt = this.dao.con.prepare(sql);

		const res = stmt.run(lastDateTime.toISOString());

		logger.info(`Removed ${res.changes} rows from PrnInfo`);
    }
}
