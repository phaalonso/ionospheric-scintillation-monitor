import WebSockets from "ws";
import readline from "node:readline";

const client = new WebSockets("ws://127.0.0.1:8000");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

client.on("message", (msg) => {
    console.log(msg);
});

client.on("open", () => {
    rl.addListener("line", (line) => {
        client.send(line);
    });

    for (;;) {
        client.send("AAAAAAAAAAAAAAAAA");
    }
});
