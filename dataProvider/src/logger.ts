import pino from 'pino';
import pretty from "pino-pretty";

const stream = pretty({
    colorize: true,
});

const logger = pino({
    serializers: {
        err: pino.stdSerializers.err,
    }
}, stream);

export default logger;