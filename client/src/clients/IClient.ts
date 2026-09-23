import logger from "../logger";

type MessageCB = (data: any) => void;
type ErrorCB = (error: any) => void;
type EmptyCB = () => void;

export interface IClient {
    subscribe(channel: string): void;
    onMessage(cb: MessageCB): void;
    onError(cb: ErrorCB): void;
    onEnd(cb: EmptyCB): void;
    start(): Promise<any>;
}

export abstract class Client implements IClient {
    private readonly connectedChannels = new Set<string>();
    protected connected = false;
    protected messageCB!: MessageCB;
    protected errorCB!: ErrorCB;
    protected endCB!: EmptyCB;

    subscribe(channel: string) {
        if (!this.connectedChannels.has(channel)) {
            this.connectedChannels.add(channel);

            if (this.connected) {
                logger.info(`Sending subscribe message to channel ${channel}`);
                this._sendSubscribeMessage(channel);
            }
        }
    }

    protected abstract _sendMessage(message: string): void;

    protected abstract _sendSubscribeMessage(channel: string): void;

    onMessage(cb: MessageCB) {
        this.messageCB = cb;
    }

    onError(cb: ErrorCB) {
        this.errorCB = cb;
    }

    onEnd(cb: EmptyCB) {
        this.endCB = cb;
    }

    protected abstract _connect(cb: (...args: any[]) => void): void;

    async start() {
        return new Promise((resolve, reject) => {
            if (!this.errorCB) {
                this.errorCB = (err) => {
                    console.error(err);
                    process.exit(1);
                };
            }

            if (!this.messageCB) {
                throw new Error("Message callback is undefined");
            }

            if (!this.endCB) {
                this.endCB = () => {
                    logger.info("End");
                    process.exit(1);
                };
            }

            const timeout = setTimeout(() => {
                logger.info(
                    "Não foi possível conectar com o provedor de dados",
                );
                process.exit(2);
            }, 5000);

            this._connect(() => {
                clearTimeout(timeout);
                logger.info("Connected");

                this.connectedChannels.forEach((value) => {
                    logger.info(`Subscribing to ${value}`);
                    this._sendSubscribeMessage(value);
                });

                return resolve(undefined);
            });
        });
    }
}
