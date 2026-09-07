import path from "node:path";
import { PrnIndicesBetterSqlite } from "./bettersqlite/controllers/PrnIndicesBetterSqlite";
import { PrnInfoBetterSqlite } from "./bettersqlite/controllers/PrnInfoBetterSqlite";
import { SQLite } from "./bettersqlite/database/DAO";
import { MessageHandler } from "./clients/MessageHandler";
import { WebsocketClient } from "./clients/WebsocketClient";
import { IPrnIndicesController, IPrnInfoController } from "./controller";
import logger from "./logger";
import { PrnIndicesMongo } from "./mongodb/controller/PrnIndicesMongo";
import { PrnInfoMongo } from "./mongodb/controller/PrnInfoMongo";
import { connect } from "./mongodb/database/connection";
import { ProcessData } from "./ProcessData";

let prnInfoController: IPrnInfoController;
let prnIndicesController: IPrnIndicesController;

async function initDatabase() {
    const selectedDB = process.env.DB;

    if (!selectedDB) {
        logger.log("can't find the DB variable");
        process.exit(1);
    }

    switch (selectedDB.toLocaleLowerCase()) {
        case "sqlite": {
            const dao = new SQLite();
            const prnInfo = new PrnInfoBetterSqlite(dao);
            await prnInfo.createTable();
            prnInfoController = prnInfo;

            const prnIndices = new PrnIndicesBetterSqlite(dao);
            await prnIndices.createTable();
            prnIndicesController = prnIndices;
            break;
        }
        case "mongo": {
            await connect();
            prnInfoController = new PrnInfoMongo();
            prnIndicesController = new PrnIndicesMongo();
            break;
        }
        default:
            logger.log("Unknown DB env variable, use sqlite or mongo");
            process.exit(1);
    }
}

async function start() {
    try {
        const file = path.join(__dirname, "..", "..", `sqlite.log`);
        console.log(file);
        logger.enableWrite(file);

        await initDatabase();

        const processData = new ProcessData(
            prnInfoController,
            prnIndicesController,
        );

        // const client = new WebSocketClient(processData);

        const messageHandler = new MessageHandler(processData);

        // const client = new NewSocketClient({
        //     host: 'localhost',
        //     port: 2108
        // });

        //const client = new WebsocketClient('ws://192.168.3.23:4312');
        const client = new WebsocketClient("ws://localhost:4312");

        client.onMessage(messageHandler.handle.bind(messageHandler));

        client.subscribe("custom");
        await client.start();
    } catch (err: any) {
        logger.exception(err);
    }
}

start();
