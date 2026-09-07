import Client from 'ftp';
import logger from '../logger';
import path from 'node:path';

interface UploadConfig {
	host: string;
	password: string;
	port: number;
	user: string;
	backupPath: string;
}

export interface FileInfo {
	path: string;
	fileName: string;
}

export class UploadService {
	private readonly client: Client;
	private ready: boolean;

	constructor(
		private readonly config: UploadConfig,
	) {
		this.client = new Client();
		this.ready = false;

		this.client.on('close', () => {
			this.ready = false;
		});

		this.client.on('end', () => {
			this.ready = false;
		});

		this.client.on('error', (err) => {
			logger.exception(err, 'BackupService (FTP)');
		});
	}

	public async connect() {
		return new Promise((resolve, reject) => {
			logger.log('Connecting to upload service');
			this.client.connect({
				host: this.config.host,
				password: this.config.password,
				port: this.config.port ?? 21,
				user: this.config.user,
			});


			this.client.on('ready', () => {
				this.ready = true;
				logger.log('Backup service (FTP) is ready!');

				// this.client.list(this.config.backupPath, (err, list) => {
				// 	if (err) {
				// 		const message = err.message.split(':')[1].trimStart();
				// 		if (message.startsWith('No such file')) {
				// 			this.client.mkdir(this.config.backupPath, true, (err) => {
				// 				console.log('AAAAAAa')
				// 				if (err) return reject(err);

				// 				logger.log('Creating directory');

				// 				resolve(undefined);
				// 			});
				// 		}

				// 		reject(err);
				// 	}

					resolve(undefined);
				// })
			});
		});
	}

	public async uploadFile(file: FileInfo) {
		return new Promise((resolve, reject) => {
			const destPath = path.join(this.config.backupPath, file.fileName);
			this.client.put(file.path, destPath, false, (error) => {
				if (error) {
					reject(error);
				}

				resolve(undefined);
			});
		});
	}

	public isConnected() {
		return this.ready;
	}

	public disconnect() {
		this.client.end();
	}
}
