import fs from 'node:fs';
import path from 'node:path';
import osu from 'node-os-utils';
import { publishMessage } from "./Websocket";

const file = path.join(__dirname, '..', 'cpu_ram.csv')
const writeStream = fs.createWriteStream(file);

export async function monitoring() {
	const date = new Date();

	const cpu = await osu.cpu.usage();
	let ram = (await osu.mem.used()).usedMemMb;

	publishMessage('cpu', cpu.toString());
	writeStream.write(`cpu, ${cpu}, ${date.toISOString()}\n`);
	publishMessage('ram', ram.toString());
	writeStream.write(`ram, ${ram}, ${date.toISOString()}\n`);
}
