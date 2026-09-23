const net = require("node:net");

const socket = net.connect(2108, "localhost");

socket.on("data", (data) => {
    const msg = data.toString();

    console.log(msg);
});

socket.write("sub_cpu\n");
socket.write("sub_ram\n");
