import logger from "../logger";
import { SignalMetrics } from "../model/SignalMetrics";
import { ProcessData } from "../ProcessData";
import { Buffer } from 'node:buffer';
import { Readable } from "node:stream";
import readline, { Interface as Readline } from "node:readline";

export class MessageHandler {
	private readonly bufferStream = new Readable();
	private readonly rl: Readline;

    constructor(
        private readonly processData: ProcessData,
    ) {
		this.rl = readline.createInterface({
			input: this.bufferStream,
			crlfDelay: Infinity,
		})

		this.rl.on('line', (line) => {
			this.processMessage(line);
		})
	}

    async handle(data: Buffer) {
		this.bufferStream.push(data.toString());
    }

	private processMessage(message: string) {
		// sat_prn_snr_azimuth_elevation_lat_lon_time\n
		const matchCustom = /^sat_(.*)_(.*)_(.*)_(.*)_(.*)_(.*)_(.*)$/.exec(message);

		if (!matchCustom) return;

		if (matchCustom[1] &&
			matchCustom[2] &&
			matchCustom[3] &&
			matchCustom[4] &&
			matchCustom[5] &&
			matchCustom[6] &&
			matchCustom[7]
		) {
			const customData: SignalMetrics = {
				prn: Number.parseInt(matchCustom[1]),
				snr: Number.parseFloat(matchCustom[2]) || null,
				azi: Number.parseFloat(matchCustom[3]) || null,
				elev: Number.parseFloat(matchCustom[4]) || null,
				lat: Number.parseFloat(matchCustom[5]),
				lon: Number.parseFloat(matchCustom[6]),
				time: new Date(Number.parseInt(matchCustom[7])),
			};

			this.processData.sendToBuffer(customData);
			return;
		}

		logger.log(`mensagem inválida  ${message}`);

	}
}
