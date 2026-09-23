import { SignalMetrics } from "../model/SignalMetrics";

export type FindByRPNResult = {
    snr: number;
};

export type AmountOfSNRPerPRN = {
    prn: number;
    total: number;
};

export interface IPrnInfoController {
    insert(metric: SignalMetrics): any;

    insertMany(data: SignalMetrics[]): any;

    /**
     * @description Retorna dados inseridos em prninfo agrupados num intervalo de um minuto relativo ao parametro tempo
     * @param time tempo será relativo a esse parametro
     */
    groupByPrn(time: Date): Promise<AmountOfSNRPerPRN[]>;

    /**
     * @description seleciona prn e snr de determinado prn num período de um minuto relativo ao parametro tempo
     * @param time tempo será relativo a esse parametro
     * @param prn informa de qual prn será realizado a filtragem
     */
    findByPrn(time: Date, prn: number): Promise<FindByRPNResult[]>;
    countRows(): Promise<number>;
    deleteBefore(lastDateTime: Date): Promise<void>;
}
