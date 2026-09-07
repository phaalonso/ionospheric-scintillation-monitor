import net from 'node:net';
import { PubSub, CustomSocket } from "./PubSub";
import logger from "../../logger";

interface SocketConfig {
	host: string;
	port: number;
}

export class SocketPubSub extends PubSub<net.Socket> {
	private readonly _socketServer: net.Server;

	constructor(
		private readonly _socketConfig: SocketConfig,
	) {
		super('write');
		this.createChannel('cpu');
		this.createChannel('ram');

		this._socketServer = net.createServer();

		this._socketServer.on('connection', this.handleNewConnection.bind(this));
		this._socketServer.on('error', this.handleError.bind(this));

		this._socketServer.listen({
			...this._socketConfig
		}, () => {
			logger.info(`Servidor iniciado em`, this._socketServer.address());
		});
	}

	protected sendMessage(socket: CustomSocket<net.Socket>, message: string) {
		socket.write(message);
	}

	private handleNewConnection(socket: CustomSocket<net.Socket>) {
		logger.info(`Nova conexão criada`);
		socket.channels = []; // Canais aos quais o socket está conecatdo

		socket.on('data', data => {
			this.handleMessage(socket, data);
		});

		socket.on('close', () => {
			this.disconnectSocket(socket);
		});

		socket.on('error', err => {
			logger.error(err, 'Socket');
		})
	}

	private handleError(err: NodeJS.ErrnoException) {
		if (err.code === 'EADDRINUSE') {
			logger.info('Endereço já está em uso, tentando novamente...');
			setTimeout(() => {
				this._socketServer.close();
				this._socketServer.listen({ 
					...this._socketConfig
				});
			}, 1000);
		} else {
			logger.error(err);
		}
	}
}
