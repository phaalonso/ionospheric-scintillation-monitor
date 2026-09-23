import { parentPort } from "worker_threads";
import { PrnIndicesMongo } from "../controller/PrnIndicesMongo";
import { PrnInfoController } from "../controller/PrnInfoController";
import { PrnInfoMongo } from "../controller/PrnInfoMongo";
import { connect } from "../database/connection";
import { ProcessData } from "../services/processData";
import { IWorkerMessages } from "./WorkerPool";
import dotenv from "dotenv";
import { PrnIndicesController } from "../controller/PrnIndicesController";
import { SQLite } from "../database/DAO";
import { PrnInfoSqlite } from "../controller/PrnInfoSqlite";
import { PrnIndicesSqlite } from "../controller/PrnIndicesSqlite";

dotenv.config();

let prnInfo: PrnInfoController;
let prnIndices: PrnIndicesController;
let processData: ProcessData;

if (process.env.DB === "SQLITE") {
    const dao = new SQLite();
    prnInfo = new PrnInfoSqlite(dao);
    prnIndices = new PrnIndicesSqlite(dao);
    processData = new ProcessData(prnInfo, prnIndices);

    setup();
} else {
    connect().then(() => {
        prnInfo = new PrnInfoMongo();
        prnIndices = new PrnIndicesMongo();
        processData = new ProcessData(prnInfo, prnIndices);
    });

    setup();
}

function setup() {
    parentPort.on("message", async ({ data, time }: IWorkerMessages) => {
        if (data) {
            await prnInfo.insertMany(data);
            parentPort.postMessage("Data inserted");
        } else if (time) {
            await processData.processMinute(time);
            parentPort.postMessage(`Minute ${time.getMinutes()} processed`);
        }
    });
}
