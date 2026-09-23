import { Document, Model } from "mongoose";

export interface IPrnIndices {
    prn: number;
    mediasnr: number;
    mediaazi: number;
    mediaelev: number;
    minTime: Date;
    maxTime: Date;
    dpsnr: number;
    s4: number;
}

export interface IPrnIndicesDocument extends IPrnIndices, Document {}
export interface IPrnIndicesModel extends Model<IPrnIndicesDocument> {}
