import SerialPort, { parsers } from "serialport";
import fs, { ReadStream, WriteStream } from "node:fs";
import GPS from "gps";
import logger from "./logger";
import { config } from "./config/gpsConfig";

//INFO: Talvez seria interessante possuir uma arquitetura Observer para as Streams, permitindo que exista mais de uma Stream no recebimento de dados
export class GPSProvider extends GPS {
    protected inputStream!: SerialPort | ReadStream;
    protected parserStream!: parsers.Readline;
    protected writeStream?: WriteStream;

    constructor() {
        super();
    }

    public serialInput(input: string = config.serialInput): void {
        if (this.inputStream) {
            throw new Error("There is already an input stream");
        }

        logger.info(`Receiving data from serial input: ${input}`);

        this.inputStream = new SerialPort(input, {
            baudRate: config.gps.baudRate,
        });

        this.inputStream.on("error", (error) => {
            console.error(error);
            // process.exit(1);
        });
    }

    public readFromFile(fileInput: string) {
        if (this.inputStream) {
            throw new Error("There is already an input stream");
        }

        logger.info(`Receiving data from file input ${fileInput}`);

        this.inputStream = fs.createReadStream(fileInput);

        this.inputStream.on("error", (err) => {
            logger.error(err, "Serial port");
            process.exit(1);
        });

        this.inputStream.on("end", () => {
            logger.info("End of the file");
            process.exit(1);
        });
    }

    /**
     * @description método responsável por inicializar as streams utilizadas para
     * o recebimento de dados no formato NMEA
     */
    public parse(): void {
        logger.info(`Piping data to GPS`);

        this.parserStream = new parsers.Readline({
            delimiter: "\r\n",
        });

        this.parserStream.on("error", (err) => {
            logger.error(err, "Parser");
        });

        this.inputStream.pipe(this.parserStream);

        this.parserStream.on("data", (data) => {
            try {
                this.update(data);
            } catch (error) {
                logger.error(
                    error instanceof Error ? error : String(error),
                    "Parser",
                );
            }
        });

        this.on("error", (err: Error) => logger.error(err));
    }

    /**
     * @description as informações recebidas do receptor serão escritas num arquivo.
     * @param {string} file
     * @returns {void}
     */
    public writeToFile(file: string): void {
        logger.info(`Piping data to file ${file}`);
        const writeStream = fs.createWriteStream(file);

        this.inputStream.pipe(writeStream);
    }

    public close(): void {
        this.inputStream?.close();
        this.writeStream?.close();
    }
}
