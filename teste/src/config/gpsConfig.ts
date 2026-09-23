interface GpsConfig {
    serialInput: string;
    baudRate: number;
}

export const GPSConfig: GpsConfig = {
    serialInput: "/dev/ttyUSB0",
    baudRate: 115200,
};
