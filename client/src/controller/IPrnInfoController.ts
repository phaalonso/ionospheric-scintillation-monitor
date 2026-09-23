import { SignalMetrics } from "../model/SignalMetrics";

export interface IPrnInfoController {
    insert(metric: SignalMetrics): any;

    insertMany(data: SignalMetrics[]): any;

    /**
     * @description Retorna dados inseridos em prninfo agrupados em um intervalo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     */
    groupByPrn(time: Date): any;

    /**
     * @description Seleciona prn e snr de determinado prn em um periodo de um minuto relativo ao parametro time
     * @param time tempo sera relativo a esse parametro
     * @param prn informa de qual prn será realizado a filtragem
     */
    findByPrn(time: Date, prn: number): any;
    countRows(): Promise<number>;
    deleteBefore(lastDateTime: Date): Promise<void>;
}
