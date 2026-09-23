interface ProviderAddress {
    host: string;
    port: string;
}

interface IClientConfig {
    providerAddress: ProviderAddress;
    databasePath: string;
    databaseUrl: string; // Ou existe datasePath, ou databaseUrl
    reconnectInterval: number;
}

interface IProcessConfig {
    interval: number;
    logInterval: number;
}

interface IGlobalConfig {
    process: IProcessConfig;
    client: IClientConfig;
}
