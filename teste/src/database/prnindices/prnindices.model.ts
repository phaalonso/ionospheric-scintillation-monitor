import { model } from "mongoose";
import { IPrnIndicesDocument } from "./prnindices.type";
import PrnIndicesSchema from "./prnindices.schema";

export const PrnIndicesModel = model<IPrnIndicesDocument>(
    "prnindices",
    PrnIndicesSchema,
);
