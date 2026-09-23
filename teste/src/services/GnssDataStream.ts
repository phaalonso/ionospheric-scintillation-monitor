import SerialPort, { parsers } from "serialport";
import { GPSConfig } from "../config/gpsConfig";
import fs, { ReadStream, WriteStream } from "fs";
import GPS from "gps";
import logger from "../logger";

type Callback = (chunk: any) => void;

/**
 * @description GnssDataStream is a class to help extend GPS node package, receiving
 * the NMEA data directly from the serial port
 */
export class DataProvider extends GPS {
    protected inputStream: SerialPort | ReadStream;
    protected parserStream: parsers.Readline;
    protected writeStream?: WriteStream;

    /**
     * @description receives input value that indicate from where the device will receive
     * NMEA data, defaults to /dev/ttyUSB0
     * @param input
     */
    constructor() {
        super();
    }

    public setSerialInput(input: string = GPSConfig.serialInput) {
        if (this.inputStream) {
            throw new Error("There is already an input stream");
        }

        logger.log(`Receiving data from serial input: ${input}`);

        this.inputStream = new SerialPort(input, {
            baudRate: GPSConfig.baudRate,
        });

        this.inputStream.on("error", (err: Error) => {
            if (err.message.includes("No such file or directory")) {
                logger.log(`Cant find input file ${input}`);
                process.exit(1);
            }

            logger.exception(err, "Serial port");
        });
    }

    public setFileInput(fileInput: string) {
        if (this.inputStream) {
            throw new Error("There is already an input stream");
        }

        logger.log(`Receiving data from file input ${fileInput}`);

        this.inputStream = fs.createReadStream(fileInput);

        this.inputStream.on("error", (err) => {
            logger.exception(err, "Serial port");
        });

        this.inputStream.on("end", () => {
            process.exit(0);
        });
    }

    public pipeToGps(): void {
        logger.log(`Piping data to GPS`);

        this.parserStream = new parsers.Readline({
            delimiter: "\r\n",
        });

        this.parserStream.on("error", (err) => {
            logger.exception(err, "Parser");
        });

        this.inputStream.pipe(this.parserStream);

        this.parserStream.on("data", (data) => {
            try {
                this.update(data);
            } catch (err) {
                logger.exception(err.message);
            }
        });

        this.parserStream.on("error", (err) => {
            logger.exception(err, "Parser");
        });
    }

    public pipeToFile(file: string): void {
        logger.log(`Piping data to file ${file}`);
        const writeStream = fs.createWriteStream(file);

        this.inputStream.pipe(writeStream);
    }

    public close(): void {
        this.writeStream?.close();
        this.inputStream?.close();
    }
}
