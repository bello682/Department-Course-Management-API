const ChatMessage = require("../models/message");
const Conversation = require("../models/conversation");

const chatSocketHandler = (io) => {
	io.on("connection", (socket) => {
		console.log("🔌 User connected:", socket.id);

		socket.on("join", ({ userId, role }) => {
			if (!userId || !["User", "Admin"].includes(role)) return;
			socket.join(userId);
			console.log(`🟢 ${role} joined room: ${userId}`);
		});

		socket.on("sendMessage", async (data) => {
			try {
				// Destructure to get clientId from the incoming data
				const { senderId, receiverId, text, role, clientId } = data; // <-- ADD clientId here

				const senderModel = ["Admin", "User"].includes(role) ? role : null;

				if (!senderId || !receiverId || !text || !senderModel) {
					console.warn("Invalid socket data:", data);
					return;
				}

				if (!senderModel) return;

				let conversation = await Conversation.findOne({
					$and: [
						{ participants: { $elemMatch: { id: senderId } } },
						{ participants: { $elemMatch: { id: receiverId } } },
					],
				});

				if (!conversation) {
					conversation = await Conversation.create({
						participants: [
							{ id: senderId, model: senderModel },
							{
								id: receiverId,
								model: senderModel === "Admin" ? "User" : "Admin",
							},
						],
					});
				}

				const messageDoc = new ChatMessage({
					conversationId: conversation._id,
					sender: senderId,
					senderModel,
					receiver: receiverId,
					receiverModel: senderModel === "Admin" ? "User" : "Admin",
					text,
					createdAt: new Date(),
				});

				const saved = await messageDoc.save();

				const payload = {
					_id: saved._id, // Renamed 'id' to '_id' for consistency with MongoDB docs
					senderModel,
					text: saved.text,
					createdAt: saved.createdAt.toISOString(), // Send as ISO string for client to parse
					clientId: clientId, // <-- IMPORTANT: Pass the original clientId back!
				};

				// Emit to the receiver (admin)
				io.to(receiverId).emit("receiveMessage", payload);
				// Emit to the sender (user)
				io.to(senderId).emit("receiveMessage", payload);
			} catch (error) {
				console.error("❌ Socket sendMessage error:", error.message);
				// Optionally, emit an error back to the sender if message saving failed
				// socket.emit("messageError", { clientId: data.clientId, error: error.message });
			}
		});

		socket.on("disconnect", () => {
			console.log("🔌 User disconnected:", socket.id);
		});
	});
};

module.exports = chatSocketHandler;
