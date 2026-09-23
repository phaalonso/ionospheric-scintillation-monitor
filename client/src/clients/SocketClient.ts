import net from "node:net";
import logger from "../logger";
import { Client } from "./IClient";

interface SocketClientConfig {
    host: string;
    port: number;
}

export class SocketClient extends Client {
    private readonly client = new net.Socket();
    private readonly config: SocketClientConfig;

    constructor(configurations: SocketClientConfig) {
        super();
        this.config = configurations;
    }

    protected sendMessage(message: string) {
        logger.info(`Sending message: ${message}`);
        this.client.write(message);
    }

    protected sendSubscribeMessage(channel: string) {
        logger.info(`Subscribing to: ${channel}`);
        this.sendMessage(`sub_${channel}\n`);
    }

    protected connect(cb: (...args: any[]) => void) {
        this.client.on("connect", cb);
        this.client.on("data", this.messageCB);

        this.client.on("error", this.errorCB);

        this.client.on("end", this.endCB);

        this.client.connect({
            port: this.config.port,
            host: this.config.host,
        });
    }
}
