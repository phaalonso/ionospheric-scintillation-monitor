import WebSocket from "ws";
import logger from "../logger";
import { Client } from "./IClient";

export class WebsocketClient extends Client {
    private client!: WebSocket;

    constructor(private readonly websocketUrl: string) {
        super();
    }

    protected sendMessage(message: string) {
        this.client.send(message);
    }
    protected sendSubscribeMessage(channel: string) {
        this.client.send(`sub_${channel}\n`);
    }
    protected connect(cb: (...args: any[]) => void) {
        logger.info(`Conectando com ${this.websocketUrl}`);
        this.client = new WebSocket(this.websocketUrl);
        this.client.on("open", cb);
        this.client.on("message", this.messageCB);
        this.client.on("error", this.errorCB);
        this.client.on("close", this.endCB);
    }
}
