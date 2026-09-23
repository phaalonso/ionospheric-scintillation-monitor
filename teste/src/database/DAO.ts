import { Database } from "sqlite3";
import logger from "../logger";

export class SQLite {
    private readonly filePath: string;
    public con: Database;

    constructor(dbFilePath?: string) {
        this.filePath = dbFilePath || "dados.db";
        this.con = new Database(this.filePath, (err) => {
            if (err) {
                logger.exception(
                    "Não foi possível conectar com o banco de dados",
                );
                process.exit(1);
            } else {
                logger.log("Creating database connection");
                this.con.run("PRAGMA synchronous=OFF");
            }
        });
    }

    public run(sql: string, params = []) {
        return new Promise((res, rej) => {
            this.con.run(sql, params, function (err) {
                if (err) {
                    logger.log(`Erro ao executar a query ${sql}`);
                    logger.exception(err);
                    rej(err);
                } else {
                    res({ id: this.lastID });
                }
            });
        });
    }

    public get(sql: string, params = []) {
        return new Promise((res, rej) => {
            this.con.get(sql, params, (err, result) => {
                if (err) {
                    logger.log(`Erro ao executar a query ${sql}`);
                    logger.exception(err);
                    rej(err);
                } else {
                    res(result);
                }
            });
        });
    }

    public all(sql: string, params = []) {
        return new Promise((res, rej) => {
            this.con.all(sql, params, (err, rows) => {
                if (err) {
                    logger.log(`Erro ao executar a query ${sql}`);
                    logger.exception(err);
                    rej(err);
                } else {
                    res(rows);
                }
            });
        });
    }

    public serialize(cb: () => void) {
        this.con.serialize(cb);
    }
}
