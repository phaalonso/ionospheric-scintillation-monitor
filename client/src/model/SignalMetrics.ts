export interface SignalMetrics {
    prn: number;
    snr: number | null;
    azi: number | null;
    elev: number | null;
    lat: number;
    lon: number;
    time: Date;
}
