import { Schema } from "mongoose"

const PrnIndicesSchema = new Schema({
	prn: {
		type: Schema.Types.Number,
		required: true,
	},
	mediasnr: {
		type: Schema.Types.Number,
		required: true,
	},
	mediaazi: {
		type: Schema.Types.Number,
		required: true,
	},
	mediaelev: {
		type: Schema.Types.Number,
		required: true,
	},
	minTime: {
		type: Schema.Types.Date,
		required: true,
	},
	maxTime: {
		type: Schema.Types.Date,
		required: true,
	},
	dpsnr: {
		type: Schema.Types.Number,
		required: true,
	},
	s4: {
		type: Schema.Types.Number,
		required: true,
	}
});

export default PrnIndicesSchema;
