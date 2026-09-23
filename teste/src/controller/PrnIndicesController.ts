/**
 * @description methods that PrnIndicesControllers should have
 * @abstract
 */
export abstract class PrnIndicesController {
    abstract insertProcessedData(
        dpSnr: number,
        s4: number,
        time: Date,
        prn: number,
    );

    abstract indicesLength(): Promise<number>;
}
