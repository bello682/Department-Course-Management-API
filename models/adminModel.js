const { Schema, model } = require("mongoose");
const moment = require("moment");

const adminSchema = new Schema(
	{
		name: { type: String, required: true },
		email: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
				message: "Please enter a valid email address.",
			},
		},
		password: { type: String, required: true },
		phoneNumber: { type: String, required: true, unique: true },
		status: { type: String, default: "inactive" },
		isVerified: { type: Boolean, default: false },
		role: { type: String, default: "admin" },
		otp: { type: String },
		otpExpiresAt: {
			type: Date,
			default: () => moment().add(5, "minutes").toDate(),
		},
		timeOfActive: { type: Date, default: null },
		timeOfInactive: { type: Date, default: null },
		lastLogin: { type: Date },
		activeDuration: { type: String, default: 0 },
		activeDateAndTime: {
			type: String,
			default: () => moment().format("YYYY-MM-DD HH:mm:ss"),
		},
		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },
		date_created: { type: Date, default: Date.now },
		date_updated: { type: Date, default: Date.now },
	},
	{ timestamps: true }
);

module.exports = model("Admin", adminSchema);
