import path from 'node:path';
import { GPSProvider } from '../../dataProvider/src/GnssDataStream';
import { ProcessData } from './ProcessData';
import { SignalMetrics } from './model/SignalMetrics';
import { SQLite } from './bettersqlite/database/DAO';
import { PrnInfoBetterSqlite } from './bettersqlite/controllers/PrnInfoBetterSqlite';
import { PrnIndicesBetterSqlite } from './bettersqlite/controllers/PrnIndicesBetterSqlite';

const file = path.join(__dirname, '..', '..', 'gpsData.nmea')

const dataStream = new GPSProvider();

let time = new Date();
let lat: number;
let lon: number;

async function run() {
    const dao = new SQLite();
    const prnInfo = new PrnInfoBetterSqlite(dao);
    await prnInfo.createTable();
    const prnIndices = new PrnIndicesBetterSqlite(dao)
    await prnIndices.createTable();
    const processData = new ProcessData(prnInfo, prnIndices);

    dataStream.on('data', async data => {
        if (data.time) {
            time = data.time;
            lat = data.lat;
            lon = data.lon;
        }

        if (!data.msgNumber || data.msgNumber == "null" || !data.satellites || !lat || !lon) {
            return;
        } else {
            console.log(data);
            for (const satelite of data.satellites) {
                const customData: SignalMetrics = {
                    prn: satelite.prn,
                    snr: satelite.snr,
                    azi: satelite.azimuth,
                    elev: satelite.elevation,
                    lat: lat,
                    lon: lon,
                    time: time,
                };

                processData.sendToBuffer(customData);
            }
        }
    })

    dataStream.readFromFile(file);
    dataStream.parse();
}

run();
