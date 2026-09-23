import { inspect } from "util";
import { createWriteStream, WriteStream } from "fs";

const stdout = process.stdout;
let stream: WriteStream;

const enableWrite = (output: string) => {
    stream = createWriteStream(output);
};

const log = (...args: any[]) => {
    const time = new Date().toLocaleString("pt-br");

    // for (const a of args)
    //     console.log(a.stack ? a.stack || a.name || a.message : a);
    const message =
        args.length > 1
            ? args
                  .map((a) =>
                      typeof a === "object" ? inspect(a) : a.toString(),
                  )
                  .join(" ")
            : args.toString();
    stdout.write(`[\x1b[32m${time}\x1b[0m] ${message}\n`);
    stream?.write(`[${time}] ${message}\n`);
};

const exception = (err: Error | string, prefix?: string) => {
    let message: string;
    let stack: string | undefined;

    if (err instanceof Error) {
        message = err.message;
        stack = err.stack;
    } else {
        message = typeof err === "string" ? err : inspect(err);
        stack = new Error(message).stack;
    }

    log(
        `${prefix ? `\x1b[34m${prefix}\x1b[0m ` : ""} ${message}, stack ${stack || "N/A"}`,
    );
};

const logger = {
    log,
    exception,
    enableWrite,
};

export default logger;
