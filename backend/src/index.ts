import "reflect-metadata";

import http from "http";
import express from "express";
import morgan from "morgan";

import router from "./routes";
import cors from "cors";
import { createTopic, WebsocketFactory } from "./Websocket";
import { monitoring } from "./monitoring";
import prisma from "./client";
import UserService from "./services/UserService";

const app = express();

const server = http.createServer(app);

app.use(express.json());

app.use(cors({ origin: "*" }));

app.use(morgan("dev"));

app.use(router);

async function main() {
    try {
        await prisma.$connect();

        const hasAdmin = await UserService.hasAdmin();

        if (!hasAdmin) {
            await UserService.create({
                nome: "Administrator",
                nickname: "admin",
                email: "admin@admin.com",
                password: "changeit",
                administrator: true,
            });

            console.log(
                "Não foi encontrado um usuário administrador, por isso foi criado um usuário padrão. Por favor altere as credenciais de acesso",
            );
            console.log("Email: admin@admin.com");
            console.log("Senha: changeit");
        }

        WebsocketFactory(server);

        createTopic("cpu");
        createTopic("ram");

        server.listen(3333, () => {
            console.log("Server is online");

            setInterval(monitoring, 500);
        });
    } catch (err) {
        console.error(err);
        await prisma.$disconnect();
    }
}

main();
