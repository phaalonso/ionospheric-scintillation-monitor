import { Schema } from "mongoose";

const PrnInfoSchema = new Schema({
    prn: {
        type: Schema.Types.Number,
    },
    snr: {
        type: Schema.Types.Number,
    },
    azi: {
        type: Schema.Types.Number,
    },
    elev: {
        type: Schema.Types.Number,
    },
    lat: {
        type: Schema.Types.Number,
    },
    long: {
        type: Schema.Types.Number,
    },
    time: {
        type: Schema.Types.Date,
        required: true,
        index: true,
    },
});

export default PrnInfoSchema;
