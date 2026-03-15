const { Schema, model } = require("mongoose");
const moment = require("moment");
const subDepartmentSchema = require("../models/coursesModel");

const paymentDetailSchema = new Schema({
	method: {
		type: String,
		enum: ["card", "transfer", "ussd", "wallet", "crypto"],
		required: true,
	},
	provider: { type: String }, // e.g., Paystack, Flutterwave
	last4Digits: { type: String }, // for card
	accountName: { type: String },
	accountNumber: { type: String },
	bankName: { type: String },
	savedOn: { type: Date, default: Date.now },
});

const receiptSchema = new Schema({
	email: { type: String, required: true },
	transactionId: { type: String, required: true },
	courseTitle: { type: String, required: true },
	amountPaid: { type: Number, required: true },
	methodOfPayment: {
		type: String,
		enum: ["card", "transfer", "ussd", "wallet", "crypto"],
		required: true,
	},
	date: { type: Date, default: Date.now },
});

const userSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			minlength: 2,
			trim: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			validate: {
				validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
				message: "Please enter a valid email address.",
			},
		},
		phoneNumber: { type: String, required: true, unique: true },
		password: { type: String, required: true },
		isVerified: { type: Boolean, default: false },
		status: { type: String, default: "inactive" },
		role: { type: String, default: "user" },
		date_created: { type: Date, default: Date.now },
		date_updated: { type: Date, default: Date.now },
		verification_status: { type: String, default: "pending" },
		otp: { type: String },
		otpExpiresAt: {
			type: Date,
			default: () => moment().add(5, "minutes").toDate(),
		},
		requestCount: { type: Number, default: 0 },
		deviceId: { type: String },
		resetPasswordToken: { type: String },
		resetPasswordExpires: { type: Date },
		timeOfActive: { type: Date, default: null },
		timeOfInactive: { type: Date, default: null },
		lastLogin: { type: Date },
		activeDuration: { type: String, default: 0 },
		activeDateAndTime: {
			type: String,
			default: () => moment().format("YYYY-MM-DD HH:mm:ss"),
		},
		conversations: [{ type: Schema.Types.ObjectId, ref: "Conversation" }],
		subDepartments: [subDepartmentSchema], // Applied courses
		paymentDetails: [paymentDetailSchema], // Saved payment methods
		receipts: [receiptSchema], // Past payments
		totalAmountPaid: { type: Number, default: 0 },
	},
	{ timestamps: true }
);

// Middleware to prefix modules and update requestCount
userSchema.pre("save", function (next) {
	if (Array.isArray(this.subDepartments)) {
		this.subDepartments.forEach((subDept) => {
			if (Array.isArray(subDept.modules)) {
				subDept.modules = subDept.modules.map((module, index) => {
					if (!module.startsWith("Module")) {
						return `Module ${index + 1}: ${module}`;
					}
					return module;
				});
			}
		});
		this.requestCount = this.subDepartments.length;
	}
	next();
});

// crucial: Define the partial unique index on the userSchema
userSchema.index(
	{ "receipts.transactionId": 1 }, // Index on the transactionId field within the receipts array
	{ unique: true, sparse: true } // Enforce uniqueness only for documents where transactionId exists and is not null
);

module.exports = model("User", userSchema);
