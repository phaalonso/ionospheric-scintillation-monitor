import { ConnectOptions } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

interface Config {
    url: string;
    options: ConnectOptions;
}

export const MongoConfig: Config = {
    url: process.env.MONGOURI,
    options: {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        keepAlive: true,
        poolSize: 30,
    },
};
