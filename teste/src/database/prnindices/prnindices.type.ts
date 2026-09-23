import { Document, Model } from "mongoose";

export interface IPrnIndices {
    prn: Number;
    mediasnr: Number;
    mediaazi: Number;
    mediaelev: Number;
    minTime: Date;
    maxTime: Date;
    dpsnr: Number;
    s4: Number;
}

export interface IPrnIndicesDocument extends IPrnIndices, Document {}
export interface IPrnIndicesModel extends Model<IPrnIndicesDocument> {}
