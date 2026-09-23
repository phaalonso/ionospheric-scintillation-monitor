import { CustomSocket, PubSub } from "./PubSub";
import osu from "node-os-utils";
import WebSocket from "ws";
import logger from "../../logger";

const { cpu, mem } = osu;

export class WebsocketPubSub extends PubSub<CustomSocket<WebSocket>> {
    private readonly wsS: WebSocket.Server;

    constructor() {
        super("send");
        this.createChannel("cpu");
        this.createChannel("ram");

        this.wsS = new WebSocket.Server({
            port: 4312,
        });

        this.handleNewConnection();
        this.errorHandler();

        this.listening();
    }

    protected sendMessage(socket: CustomSocket<WebSocket>, message: string) {
        socket.send(message);
    }

    private handleNewConnection() {
        this.wsS.on("connection", (socket: CustomSocket<WebSocket>) => {
            console.log(`Nova conexão criada`);
            socket.channels = []; // Canais aos quais o socket está conectado

            socket.on("message", (data) => {
                this.handleMessage(socket, data);
            });

            socket.on("close", () => {
                this.disconnectSocket(socket);
            });
        });
    }

    private errorHandler() {
        this.wsS.on("error", (err) => {
            if (err.name === "EADDRINUSE") {
                logger.info("Endereço já está em uso, tentando novamente...");
                this.wsS.close();
            } else {
                logger.error(err);
            }
        });
    }

    private listening() {
        this.wsS.on("listening", () => {
            logger.info(`servidor iniciado em ${this.wsS.address()}`);

            setInterval(
                (server: WebsocketPubSub) => {
                    if (
                        server.listeningChannels.get("cpu") &&
                        server.listeningChannels.get("cpu")!.size > 0
                    ) {
                        cpu.usage().then((cpu) => {
                            logger.info(cpu);
                            server.pub("cpu", `cpu_${cpu}`);
                        });
                    }

                    if (
                        server.listeningChannels.get("ram") &&
                        server.listeningChannels.get("ram")!.size > 0
                    ) {
                        //logger.info(mem.totalMem());
                        mem.used().then((ram) => {
                            logger.info(ram.usedMemMb);
                            server.pub("ram", `ram_${ram.usedMemMb}`);
                        });
                    }
                },
                1000,
                this,
            );
        });
    }
}
