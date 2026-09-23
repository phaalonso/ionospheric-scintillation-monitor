import { Document, Model } from "mongoose";

export interface IPrnInfo {
    prn: number;
    snr: number;
    azi: number;
    elev: number;
    lat: number;
    long: number;
    time: Date;
}

export interface IPrnInfoDocument extends IPrnInfo, Document {}
export interface IPrnInfoModel extends Model<IPrnInfoDocument> {}
