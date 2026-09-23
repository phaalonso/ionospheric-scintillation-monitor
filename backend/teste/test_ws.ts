import Websocket, { RawData } from "ws";

const ws = new Websocket("ws://localhost:3333");

ws.on("message", (message: RawData) => {
    console.log(message.toString());
});

ws.on("error", (error: Error) => {
    console.error(error);
});

ws.on("close", () => {
    console.log("Closing");
});

ws.on("open", () => {
    ws.send("sub_cpu");
    ws.send("sub_ram");
});
