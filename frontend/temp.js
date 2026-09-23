const Websocket = require("ws");

const ws = new Websocket("ws://localhost:3333");

ws.on("message", (d) => console.log(d));
ws.on("open", (d) => console.log("open", d));
ws.on("ping", (d) => console.log("ping", d));
ws.on("pong", (d) => console.log("pong", d));
ws.on("error", (d) => console.log("error", d));
ws.on("upgrade", (d) => console.log("upgrade", d));
