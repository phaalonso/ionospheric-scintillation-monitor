import Database, { Database as TypeDB } from "better-sqlite3";
import logger from "../../logger";

export class SQLite {
    private readonly filePath: string;
    public con: TypeDB;

    constructor(dbFilePath?: string) {
        this.filePath = dbFilePath || "dados.db";
        try {
            this.con = new Database(this.filePath);
            logger.log("Conectado ao banco de dados");
            this.con.pragma("synchronous=OFF");
        } catch (err) {
            logger.exception("Não foi possível conectar com o banco de dados");
            process.exit(1);
        }
    }

    public run(sql: string, params = []) {
        return new Promise((resolve, reject) => {
            const stmt = this.con.prepare(sql);

            try {
                const res = stmt.run(params);

                resolve({ id: res.lastInsertRowid });
            } catch (err) {
                logger.log(`Exception ao executar ${sql}`);
                reject(err);
            }
        });
    }

    public get(sql: string, params = []) {
        return new Promise((res, rej) => {
            const stmt = this.con.prepare(sql);

            try {
                const result = stmt.get(params);

                res(result);
            } catch (err) {
                logger.log(`Exception ao executar ${sql}`);
                logger.exception(err);
                rej(err);
            }
        });
    }

    public all(sql: string, params = []) {
        return new Promise((res, rej) => {
            const stmt = this.con.prepare(sql);

            try {
                const result = stmt.all(params);

                res(result);
            } catch (err) {
                logger.log(`Exception ao executar ${sql}`);
                logger.exception(err);
                rej(err);
            }
        });
    }
}
