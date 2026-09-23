import WebSockets from "ws";

const server = new WebSockets.Server({
    port: 8000,
});

server.on("connection", (socket) => {
    console.log("Nova conexão estabelecida");

    socket.on("message", (msg) => {
        console.log(msg);

        if (msg == "end") {
            socket.close();
        }
    });

    socket.on("close", () => {
        console.log("Conexão fechada");
    });

    for (;;) {
        socket.send("AAAAAAAAAAAAAAAAA");
    }
});

server.on("close", () => {
    console.log("Closing server");
});

server.on("error", (err) => {
    console.log("err:", err);
});

process.on("exit", () => {
    server.close();
});
