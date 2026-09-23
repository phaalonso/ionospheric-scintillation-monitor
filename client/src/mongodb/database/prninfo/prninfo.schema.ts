import { Schema } from "mongoose";

const { Number, Date } = Schema.Types;

const PrnInfoSchema = new Schema({
    prn: {
        type: Number,
    },
    snr: {
        type: Number,
    },
    azi: {
        type: Number,
    },
    elev: {
        type: Number,
    },
    lat: {
        type: Number,
    },
    long: {
        type: Number,
    },
    time: {
        type: Date,
        required: true,
        index: true,
    },
});

export default PrnInfoSchema;
