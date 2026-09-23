import Mongoose, { Connection } from "mongoose";
import logger from "../../logger";
import { MongoConfig } from "../config/mongodb";

let connection: Connection;

export const connect = async () => {
    return new Promise((resolve, reject) => {
        if (connection) return resolve(connection);

        if (!MongoConfig.url) {
            logger.log(`Nao foi possivel carregar a url ${MongoConfig.url}`);
            reject();
        }

        Mongoose.connect(MongoConfig.url, MongoConfig.options)
            .then(() => {
                connection = Mongoose.connection;

                connection.once("open", async () => {
                    logger.log("Conectado ao banco de dados");
                });

                connection.on("error", async (err) => {
                    logger.log("Erro no banco de dados");
                    logger.log(err);
                });

                resolve(connection);
            })
            .catch((err) => reject(err));
    });
};

export const disconnect = async () => {
    if (!connection) return;

    await Mongoose.disconnect();
    logger.log("Desconectado!");
};
