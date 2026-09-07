import logger from "../../logger";

export type CustomSocket<T> = T & { channels?: string[] };

export abstract class PubSub<T> {
    protected readonly listeningChannels = new Map<
        string,
        Set<CustomSocket<T>>
    >();

    protected constructor(protected _methodName = "write") {}

    protected abstract sendMessage(socket: T, message: string): void;

    /**
     * @description create a channel with given channel name
     * @param channelName
     */
    public createChannel(channelName: string) {
        this.listeningChannels.set(channelName, new Set<CustomSocket<T>>());
        logger.log(`Creating channel with name ${channelName}`);
    }

    /**
     * @description Subscribe a socket in a determined channel
     * @param channelName
     * @param socket
     */
    public sub(channelName: string, socket: CustomSocket<T>) {
        const channel = this.listeningChannels.get(channelName);

        if (!channel || channel.has(socket)) return;

        channel.add(socket);
        logger.log(`Subscribe in ${channelName}`);
        socket.channels = socket.channels || [];
        socket.channels.push(channelName);
    }

    /**
     * @description desconecta um socket de todos os canais o qual este esta inscrito
     * @param socket
     */
    public disconnectSocket(socket: CustomSocket<T>) {
        if (socket.channels && socket.channels.length > 0) {
            for (const channelName of socket.channels) {
                const channel = this.listeningChannels.get(channelName);

                if (channel) channel.delete(socket);
            }
        }
    }

    /**
     * @description Publish a message in a determined channel
     * @param channelName
     * @param message
     */
    public pub(channelName: string, message: string) {
        const channel = this.listeningChannels.get(channelName);

        if (!channel || channel.size == 0) {
            //console.log('Channel size:', channel.size);
            return;
        }

        //process.stdout.write(`Sending ${message} on channel ${channelName}\n`);

        channel.forEach((con) => {
            this.sendMessage(con, message);
        });
    }

    public echo(message: string) {
        this.listeningChannels.forEach((channel) => {
            channel.forEach((con) => {
                // @ts-ignore
                this.sendMessage(con, message);
            });
        });
    }

    public handleMessage(socket: CustomSocket<T>, data: any) {
        const msgArray = data.toString().split("\n");

        for (const msg of msgArray) {
            logger.log(`Received message: ${msg}`);

            const matchSub = msg.match(/^sub_(.*)$/);

            if (matchSub?.[1]) {
                const channel = matchSub[1];
                this.sub(channel, socket);
                this.sendMessage(socket, `rec_${msg}`);
                return;
            }

            const matchPub = /^pub_(.*)_(.*)$/.exec(msg);

            if (matchPub?.[1] && matchPub[2]) {
                const channel = matchPub[1];
                const message = matchPub[2];

                this.pub(channel, message);
                this.sendMessage(socket, `rec_${msg}`);
                return;
            }

            logger.exception(new Error(`Comando desconhecido ${msg}`));
        }
    }
}
