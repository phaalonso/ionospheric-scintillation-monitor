import net from "node:net";
import { PubSub, CustomSocket } from "./PubSub";
import logger from "../../logger";

interface SocketConfig {
    host: string;
    port: number;
}

export class SocketPubSub extends PubSub<net.Socket> {
    private readonly socketServer: net.Server;

    constructor(private readonly socketConfig: SocketConfig) {
        super("write");
        this.createChannel("cpu");
        this.createChannel("ram");

        this.socketServer = net.createServer();

        this.socketServer.on("connection", this.handleNewConnection.bind(this));
        this.socketServer.on("error", this.handleError.bind(this));

        this.socketServer.listen(
            {
                ...this.socketConfig,
            },
            () => {
                logger.info(`Servidor iniciado`);
            },
        );
    }

    protected sendMessage(socket: CustomSocket<net.Socket>, message: string) {
        socket.write(message);
    }

    private handleNewConnection(socket: CustomSocket<net.Socket>) {
        logger.info(`Nova conexão criada`);
        socket.channels = []; // Canais aos quais o socket está conecatdo

        socket.on("data", (data) => {
            this.handleMessage(socket, data);
        });

        socket.on("close", () => {
            this.disconnectSocket(socket);
        });

        socket.on("error", (err) => {
            logger.error(err, "Socket");
        });
    }

    private handleError(err: NodeJS.ErrnoException) {
        if (err.code === "EADDRINUSE") {
            logger.info("Endereço já está em uso, tentando novamente...");
            setTimeout(() => {
                this.socketServer.close();
                this.socketServer.listen({
                    ...this.socketConfig,
                });
            }, 1000);
        } else {
            logger.error(err);
        }
    }
}
