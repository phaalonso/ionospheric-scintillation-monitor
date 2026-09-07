import { Server } from "node:http";
import jwt from 'jsonwebtoken';
import Websocket, { RawData } from "ws";
import { SERVER } from "./config/server";
import logger from "./logger";

const subscriptions: Record<string, Websocket[]> = {};

const onError = (_ws: Websocket, error: Error) => {
    console.error(error);
}

export function WebsocketFactory(server: Server) {
    const wss = new Websocket.Server({ path: '/websocket', server });

    wss.on('connection', (ws: Websocket) => {
        const timeout = setTimeout(() => {
            ws.close();
        }, 300);

        ws.on('message', (data: RawData) => {
            const message = data.toString();

            const sub = new RegExp(/^sub_(.+)/).exec(message);

            if (sub?.[1]) {
                const topic = sub[1];
                if (!subscriptions[topic]) {
                    return ws.send('err_unknow topic');
                }

                subscriptions[topic].push(ws);

                ws.send(`subscribe_${topic}`);
            }

            const sub2 = new RegExp(/^token_(.+)/).exec(message);

            if (sub2?.[1]) {
                try {
                    const token = sub2[1];

                    jwt.verify(token, SERVER!.JWT!)

                    clearTimeout(timeout);
                    logger.info('Conexão websocket autenticada');
                } catch (error) {
                    logger.error(error, 'Fechando conexão não autenticada');
                    ws.close();
                }
            }

            ws.send(`received_${message}`);
        });

        ws.on('error', (error) => onError(ws, error));

        ws.on('close', () => {
            cancelSubscription(ws, 'cpu');
            cancelSubscription(ws, 'ram');

            logger.info('Uma conexão foi fechada');
        });

        //ws.send('Hi there, I am a Websocket server');
    });
}

export function createTopic(topicName: string) {
    if (subscriptions[topicName]) {
        throw new Error('Topic already exist');
    }

    subscriptions[topicName] = [];
}

export function cancelSubscription(_ws: Websocket, topicName: string) {
    logger.info(`Canceling the subscription for ${topicName}`);

    if (!subscriptions[topicName]) {
        throw new Error('Topic not exist');
    }

    // Limpa a lista de mensagens, removendo todos os clientes que fecharam a conexão
    subscriptions[topicName] = subscriptions[topicName].filter(w => w.readyState !== 3);
}

export function publishMessage(topicName: string, data: string) {
    if (!subscriptions[topicName]) {
        throw new Error('Topic not exist');
    }

    const members = subscriptions[topicName];

    if (members.length == 0)
        return;

    const message = `${topicName}_${data}`;

    members.forEach((ws: Websocket) => {
        ws.send(message, (err) => {
            if (err) logger.error(err)
        });
    });

    logger.info('Message [%s] has been send to %d clients', message, members.length);
}
