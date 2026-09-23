import { DataProvider } from "./services/GnssDataStream";
import logger from "./logger";
import { CustomData } from "./services/processData";
import { WorkerPool } from "./worker/WorkerPool";
import { PrnInfoMongo } from "./controller/PrnInfoMongo";
import { PrnIndicesMongo } from "./controller/PrnIndicesMongo";
import { connect } from "./database/connection";
import { PrnInfoController } from "./controller/PrnInfoController";
import { SQLite } from "./database/DAO";
import { PrnIndicesController } from "./controller/PrnIndicesController";
import { PrnInfoBetterSqlite } from "./controller/PrnInfoBetterSqlite";
import { PrnIndicesBetterSqlite } from "./controller/PrnIndicesBetterSqlite";
import dotenv from "dotenv";

dotenv.config();

let dataBuffer: CustomData[] = [];

// Intervalo entre as inserções
const interval = 15000;

// Quantidade minima de inserções para executar a query
const minCounter = 60000 / interval;

let prnInfo: PrnInfoController;
let prnIndices: PrnIndicesController;

if (process.env.DB === "SQLITE") {
    const db = new SQLite();

    prnInfo = new PrnInfoBetterSqlite(db);
    prnIndices = new PrnIndicesBetterSqlite(db);

    //@ts-ignore
    prnInfo
        .createTable()
        .then(() => {
            //@ts-ignore
            prnIndices
                .createTable()
                .then(() => {
                    Serial();
                })
                .catch((err) => {
                    logger.exception(err);
                    console.log("Não foi possível criar a tabela");
                });
        })
        .catch((err) => {
            logger.exception(err);
            console.log("Não foi possível criar a tabela");
        });
} else if (process.env.DB === "MONGO") {
    prnInfo = new PrnInfoMongo();
    prnIndices = new PrnIndicesMongo();

    connect()
        .then(() => {
            Serial();
        })
        .catch((err) => {
            console.log(err);
            console.log("Não foi possível conectar com a b ase de dados");
            process.exit(1);
        });
}

async function Serial() {
    setInterval(
        () => {
            prnInfo.infoLength().then((len) => {
                logger.log(`Prninfo length ${len}`);
            });

            prnIndices.indicesLength().then((len) => {
                logger.log(`Prnindices length ${len}`);
            });
        },
        1000 * 60 * 30,
    );

    //const pool = new WorkerPool(os.cpus().length);
    const pool = new WorkerPool(2);

    try {
        const dataStream = new DataProvider();
        dataStream.setSerialInput("/dev/ttyUSB0");

        dataStream.pipeToGps();

        let counter = 0;
        let time = new Date();
        let lat: number;
        let lon: number;

        dataStream.on("data", async (data) => {
            if (data.time) {
                time = data.time;
                lat = data.lat;
                lon = data.lon;
            }

            if (
                !data.msgNumber ||
                data.msgNumber == "null" ||
                !data.satellites ||
                !lat ||
                !lon
            ) {
                return;
            } else {
                for (const satelite of data.satellites) {
                    const customData: CustomData = {
                        prn: satelite.prn,
                        snr: satelite.snr,
                        azi: satelite.azimuth,
                        elev: satelite.elevation,
                        lat: lat,
                        lon: lon,
                        time: time,
                    };

                    dataBuffer.push(customData);
                    // processData.processCustomData(customData);
                }
            }
        });

        setInterval(() => {
            /**
             * É executada a cada 15 segundos e processa os dados obtidos até então
             * após o processamento limpa o array de dados
             */
            logger.log(
                `Adding new task to the queue! ${dataBuffer.length} objects`,
            );

            if (dataBuffer.length == 0) {
                logger.log("BUFFER VAZIO!!");
                return;
            }

            const task_time = dataBuffer[0].time;

            pool.runTask({ data: dataBuffer }, (err, data) => {
                logger.log("Task done!");
                if (err) {
                    logger.exception(err);
                    return;
                }

                logger.log(data);
                counter++;

                // Garante que no determinado minuto os dados já foram processados
                if (counter >= minCounter) {
                    logger.log(
                        `Processing minute for ${time.toLocaleTimeString("pt-br")}`,
                    );
                    pool.runTask({ time: task_time }, (err, data) => {
                        if (err) {
                            logger.exception(err);
                            return;
                        }

                        logger.log("Processingo of minute was finished");
                    });
                    counter = 0;
                }
            });

            dataBuffer = [];
        }, interval);

        dataStream.on("error", (err) => {
            logger.log("Erro no GnssDataStream");
            logger.log(err);
        });
    } catch (err) {
        logger.exception(err);
        process.exit(1);
    }
}
