import net from "net";
import readline from "readline";

const client = new net.Socket();
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

client.connect(4000, "127.0.0.1", () => {
    console.log("Conectou");

    rl.addListener("line", (line) => {
        client.write(line);
    });

    client.on("data", (data) => {
        process.stdout.write(data.toString());
    });

    setTimeout(() => {
        console.log("Timeout");
        client.write("end");
        client.end(() => {
            console.log("ended");
            client.unref();
        });
    }, 1000 * 5);
});
