import path from 'node:path';
import { GPSProvider } from './GnssDataStream';
import { createWriteStream } from 'node:fs';
import logger from './logger';

const nmea = false;

const stream = new GPSProvider();

if (nmea) {
    const filePath = path.join(__dirname, '..', '..', 'gpsData.nmea');

    logger.info(`Saving data into ${filePath}`);
    stream.serialInput('/dev/ttyUSB0');

    stream.writeToFile(filePath);
} else {
    const filePath = path.join(__dirname, '..', '..','gpsData.custom');
    const writeStream = createWriteStream(filePath);

    logger.info(`Saving data into ${filePath}`);

    stream.serialInput('/dev/ttyUSB0');

    stream.parse();

    let time = new Date();
    let lat: number;
    let lon: number;

    stream.on('data', data => {
			if (data.time) {
				time = data.time;
				lat = data.lat;
				lon = data.lon;
			}

			if (!data.msgNumber || data.msgNumber == "null" || !data.satellites || !lat || !lon) {
				return;
			} else {
				for (const satelite of data.satellites) {
-					writeStream.write(`sat_${satelite.prn}_${satelite.snr}_${satelite.azimuth}_${satelite.elevation}_${lat}_${lon}_${time.getTime()}\n`);
				}
			}

    });
}

setTimeout(() => {
    stream.close();
    process.exit(0);
}, 1000 * 60 * 60);
