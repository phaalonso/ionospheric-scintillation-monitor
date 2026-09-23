import { configurator } from "config-validation";
import path from "node:path";
import logger from "../logger";

interface GpsConfig {
    serialInput: string;
    baudRate: number;
}

const loader = configurator({
    gps: {
        serialInput: {
            type: "string",
            description: "Define o arquivo de onde será lido a stream de dados",
            required: true,
        },
        baudRate: {
            type: "number",
            description:
                "Taxa dos dados recebidos, vária de acordo com o receptor",
            default: 115200,
        },
    },
    socket: {
        host: {
            type: "string",
            description: "Socket host",
            required: true,
        },
        port: {
            type: "port",
            description: "Socket port",
            required: true,
        },
    },
    log: {
        qtdEnvioInterval: {
            type: "int",
            description: "Intervalo entre os logs de envio",
            default: 1800000,
        },
    },
});

loader.load(path.join(__dirname, "..", "..", "config.json"));

export const config = loader.getConfig();

logger.info("Config utilizada:", loader);
