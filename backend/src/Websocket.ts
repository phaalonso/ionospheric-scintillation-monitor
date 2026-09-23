import { Server } from "http";
import jwt from "jsonwebtoken";
import Websocket, { RawData } from "ws";
import { SERVER } from "./config/server";

const subscriptions: Record<string, Websocket[]> = {};

const onError = (ws: Websocket, error: Error) => {
    console.error(error);
};

export function WebsocketFactory(server: Server) {
    const wss = new Websocket.Server({ path: "/websocket", server });

    wss.on("connection", (ws: Websocket) => {
        const timeout = setTimeout(() => {
            ws.close();
        }, 300);

        ws.on("message", (data: RawData) => {
            const message = data.toString();

            const sub = message.match(/^sub_(.+)/);

            if (sub && sub[1]) {
                const topic = sub[1];
                if (!subscriptions[topic]) {
                    return ws.send("err_unknow topic");
                }

                subscriptions[topic].push(ws);

                ws.send(`subscribe_${topic}`);
            }

            const sub2 = message.match(/^token_(.+)/);

            if (sub2 && sub2[1]) {
                try {
                    const token = sub2[1];

                    jwt.verify(token, SERVER.JWT);

                    clearTimeout(timeout);
                    console.log("Conexão websocket autenticada");
                } catch (error) {
                    console.log("Fechando conexão não autenticada");
                    ws.close();
                }
            }

            ws.send(`received_${message}`);
        });

        ws.on("error", (error) => onError(ws, error));

        ws.on("close", (ws, code, reason: Buffer) => {
            cancelSubscription(ws, "cpu");
            cancelSubscription(ws, "ram");

            console.log("Uma conexão foi fechada");
        });

        //ws.send('Hi there, I am a Websocket server');
    });
}

export function createTopic(topicName: string) {
    if (subscriptions[topicName]) {
        throw Error("Topic already exist");
    }

    subscriptions[topicName] = [];
}

export function cancelSubscription(ws: Websocket, topicName: string) {
    console.log(`Canceling the subscription for ${topicName}`);

    if (!subscriptions[topicName]) {
        throw Error("Topic not exist");
    }

    // Limpa a lista de mensagens, removendo todos os clientes que fecharam a conexão
    subscriptions[topicName] = subscriptions[topicName].filter(
        (w) => w.readyState !== 3,
    );
}

export function publishMessage(topicName: string, data: string) {
    if (!subscriptions[topicName]) {
        throw Error("Topic not exist");
    }

    const members = subscriptions[topicName];

    if (members.length == 0) return;

    const message = `${topicName}_${data}`;

    members.forEach((ws: Websocket) => {
        ws.send(message, (err) => {
            if (err) console.log(err);
        });
    });

    console.log(
        "Message [%s] has been send to %d clients",
        message,
        members.length,
    );
}
