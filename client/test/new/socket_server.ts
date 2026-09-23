import net from "node:net";

const handleConnection = (socket: net.Socket) => {
    console.log("Alguem se conectou");

    socket.setTimeout(3000);

    socket.on("end", () => {
        console.log("Desconectou");
    });

    socket.on("data", (buffer) => {
        console.log(buffer);
        const str = buffer.toString();

        console.log(str);

        if (str == "end") {
            socket.end();
            socket.destroy();
        }
    });

    socket.on("close", () => {
        console.log("Close");
    });

    socket.on("timeout", () => {
        console.log("timeout");
        socket.end();
    });
};

const server = net.createServer(handleConnection);

server.on("listening", () => {
    console.log("Listening");
});

server.on("close", () => {
    console.log("Closing server");
});

server.on("error", (err) => {
    console.log("error:", err);
});

server.listen(4000, "127.0.0.1");
