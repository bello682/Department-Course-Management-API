const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
	{
		participants: [
			{
				id: {
					type: mongoose.Schema.Types.ObjectId,
					required: true,
				},
				model: {
					type: String,
					enum: ["Admin", "User"], // ✅ Correct
					required: true,
				},
			},
		],
	},
	{ timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
