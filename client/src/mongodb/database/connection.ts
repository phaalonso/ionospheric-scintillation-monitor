import Mongoose, { Connection } from "mongoose";
import logger from "../../logger";
import { MongoConfig } from "../config/mongodb";

let connection: Connection;

export const connect = async () => {
    return new Promise((resolve, reject) => {
        if (connection) return resolve(connection);

        if (!MongoConfig.url) {
            reject(
                new Error(`Nao foi possivel carregar a url ${MongoConfig.url}`),
            );
        }

        Mongoose.connect(MongoConfig.url, MongoConfig.options)
            .then(() => {
                connection = Mongoose.connection;

                connection.once("open", async () => {
                    logger.info("Conectado ao banco de dados");
                });

                connection.on("error", async (err) => {
                    logger.info("Erro no banco de dados");
                    logger.error(err);
                });

                resolve(connection);
            })
            .catch((err) => reject(err));
    });
};

export const disconnect = async () => {
    if (!connection) return;

    await Mongoose.disconnect();
    logger.info("Desconectado!");
};
