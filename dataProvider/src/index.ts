import { config } from "./config/gpsConfig";
import { GPSProvider } from "./GnssDataStream";
import logger from "./logger";
import { WebsocketPubSub } from "./services/PubSub";

/**
 * Types:
 *    - GSV -> Satelites([prn, elevation, azimuth, snr, status])
 *    - GSA -> Satelites(lista de prn), pdop, hdop, vdop
 *    - GGA -> time, lat, lon, alt, quality, num of satelites, hdop, geoidal, age
 *    - VTG -> speed, track
 *    - RMC -> lat, lon, speed, track, faa
 */

function logQtd() {
    let quantidade = 0;

    return {
        aumentar: () => {
            quantidade = quantidade + 1;
        },
        getQtd: () => quantidade
    }
}

async function start() {
    try {
        const gpsReceiver = new GPSProvider();

        // const socketPubSub = new SocketPubSub(config.socket);
        const socketPubSub = new WebsocketPubSub();

        const qtd = logQtd();

        socketPubSub.createChannel('custom');
        //webSocketPubSub.createChannel('custom');

        let time = new Date();
        let lat: number;
        let lon: number;

        // Inicia o log do contador, tempo em ms
        // 1000 * 60 * 5 - 5 minutos
        setInterval((qtd) => {
            logger.log(`Quantidade de dados enviadas: ${qtd.getQtd()}`);
        }, config.log.qtdEnvioInterval, qtd);

        gpsReceiver.serialInput('/dev/ttyUSB0');
        gpsReceiver.parse();

        gpsReceiver.on("data", async (data) => {
            if (data.time) {
                time = data.time;
                lat = data.lat;
                lon = data.lon;
            }

            if (!data.msgNumber || data.msgNumber == "null" || !data.satellites || !lat || !lon) {
                return;
            } else {
                for (const satelite of data.satellites) {
                    const message = `sat_${satelite.prn}_${satelite.snr}_${satelite.azimuth}_${satelite.elevation}_${lat}_${lon}_${time.getTime()}\n`;
                    socketPubSub.pub('custom', message);
//-					webSocketPubSub.pub('custom', message);
                    qtd.aumentar();
                }
            }
        });

        gpsReceiver.on('error', (err: Error) => {
            logger.log('Erro no GnssDataStream');
            logger.log(err);
        });
    } catch (err) {
        logger.exception(err instanceof Error ? err : String(err));
        process.exit(1);
    }
}

start();
