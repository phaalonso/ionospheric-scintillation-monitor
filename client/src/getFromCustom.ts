import * as path from 'node:path';
//import { SQLite } from './sqlite/database/DAO';
import { ProcessData } from './ProcessData';
//import { PrnInfoSqlite } from './sqlite/controller/PrnInfoSqlite';
//import { PrnIndicesSqlite } from './sqlite/controller/PrnIndicesSqlite';
import { createReadStream } from 'node:fs';
import logger from '../../dataProvider/src/logger';
import { PrnInfoMongo } from './mongodb/controller/PrnInfoMongo';
import { PrnIndicesMongo } from './mongodb/controller/PrnIndicesMongo';
import { connect } from './mongodb/database/connection';
import { MessageHandler } from './clients/MessageHandler';
import process from "node:process";

const file = path.join(__dirname, '..', '..', 'gpsData.custom');

async function run() {
    // const dao = new SQLite();
    // const prnInfo = new PrnInfoSqlite(dao);
    // await prnInfo.createTable();
    // const prnIndices = new PrnIndicesSqlite(dao)
    // await prnIndices.createTable();

    await connect();
    const prnInfo = new PrnInfoMongo();
    const prnIndices = new PrnIndicesMongo()
    const processData = new ProcessData(prnInfo, prnIndices);

    const stream = createReadStream(file);

    const messageHandler = new MessageHandler(processData);

    stream.on('open', () => {
        logger.log('Stream open');
    })

    stream.on('data', messageHandler.handle);

    stream.on('close', () => {
        process.exit(0);
    })
}

run();
