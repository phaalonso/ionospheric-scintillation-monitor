import { model } from "mongoose";
import PrnInfoSchema from "./prninfo.schema";
import { IPrnInfoDocument } from "./prninfo.type";

export const PrnInfoModel = model<IPrnInfoDocument>("prninfo", PrnInfoSchema);
