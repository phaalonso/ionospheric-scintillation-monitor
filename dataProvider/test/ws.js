const WebSocket = require("ws");

const ws = new WebSocket("ws://127.0.0.1:4312");

ws.on("unexpected-response", (e) => console.log);

ws.on("open", () => {
    console.log("Abrindo uma conexão");

    ws.send("sub_cpu");
    ws.send("sub_ram");
    ws.send("sub_freeDisk");
});

ws.on("message", (msg) => {
    console.log(`Received message: ${msg}`);
});

ws.on("error", (err) => {
    console.log(err);
});

ws.on("close", () => {
    console.log("Closing socket!");
});
