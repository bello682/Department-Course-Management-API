const Conversation = require("../models/conversation");
const Message = require("../models/message");
const Users = require("../models/userModel"); // Assuming you have a User model for populating names/emails

// Send a message (user or admin)
const sendMessage = async (req, res) => {
	try {
		const { receiverId, text } = req.body;

		if (!receiverId || !text) {
			return res
				.status(400)
				.json({ message: "receiverId and text are required" });
		}

		// ✅ Ensure the sender is authenticated
		if (!req.user && !req.admin) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		// ✅ Get sender info from auth
		const senderId = req.user ? req.user.id : req.admin.id;
		const senderModel = req.user ? "User" : "Admin";
		const receiverModel = senderModel === "Admin" ? "User" : "Admin";

		const senderStr = String(senderId);
		const receiverStr = String(receiverId);

		// ✅ Find or create conversation
		let conversation = await Conversation.findOne({
			$and: [
				{ participants: { $elemMatch: { id: senderStr } } },
				{ participants: { $elemMatch: { id: receiverStr } } },
			],
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [
					{ id: senderStr, model: senderModel },
					{ id: receiverStr, model: receiverModel },
				],
			});
		}

		// ✅ Create and save message
		const message = await Message.create({
			conversationId: conversation._id,
			sender: senderStr,
			senderModel,
			receiver: receiverStr,
			receiverModel,
			text,
		});

		return res.status(201).json({ message: "Message sent", data: message });
	} catch (error) {
		console.error("❌ sendMessage error:", error);
		return res.status(500).json({ message: "Failed to send message" });
	}
};

// Get all messages between a user and admin
const getConversationMessages = async (req, res) => {
	try {
		const { userId } = req.params; // This is the ID of the user the admin selected
		const authUserId = req.user?.id || req.admin?.id; // This is the admin's ID

		if (!authUserId) {
			return res.status(403).json({ message: "Unauthorized request" });
		}

		const userIdStr = String(userId);
		const authUserIdStr = String(authUserId);

		// 1. Find the conversation between the selected user and the authenticated admin
		const conversation = await Conversation.findOne({
			$and: [
				{ "participants.id": authUserIdStr },
				{ "participants.id": userIdStr },
			],
		});

		// This is the critical part: If no conversation is found, it returns 404
		if (!conversation) {
			return res.status(404).json({ message: "No conversation found" });
			// ^^^ This is why you get "No messages yet." on the frontend if the admin is trying to initiate.
			// If the user HAS sent a message, a conversation *should* exist.
		}

		// 2. Fetch messages belonging to this found conversation
		const messages = await Message.find({ conversationId: conversation._id })
			.sort({ createdAt: 1 })
			.populate("sender", "name email") // This populate might be an issue if senderModel is not "User" or "Admin"
			.lean(); // Add .lean() for better performance if you're not modifying the Mongoose doc

		// 3. Mark messages as read (good logic)
		await Message.updateMany(
			{
				conversationId: conversation._id,
				sender: { $ne: authUserIdStr }, // Mark messages NOT sent by the current auth user (admin) as read
				isRead: false,
			},
			{ $set: { isRead: true } }
		);

		// 4. Return messages
		res.status(200).json({ messages }); // Should return { messages: [...] }
	} catch (error) {
		console.error("Get Conversation Message Error:", error);
		res.status(500).json({ message: "Failed to load messages" });
	}
};

const getUnreadCount = async (req, res) => {
	try {
		const userId = req.user._id;
		const userModel = req.user.role === "admin" ? "Admin" : "User";

		const unreadMessages = await Message.countDocuments({
			isRead: false,
			$nor: [{ sender: userId, senderModel: userModel }],
		});

		res.status(200).json({ unreadCount: unreadMessages });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Failed to get unread count" });
	}
};

const getAllMessages = async (req, res) => {
	try {
		// ✅ Secure check: only allow admins (assuming req.admin is set by auth middleware)
		if (!req.admin) {
			return res.status(403).json({
				success: false,
				message: "Access denied. Admins only.",
			});
		}

		// ✅ Fetch all messages with minimal metadata
		const allMessages = await Message.find({})
			.sort({ createdAt: -1 })
			.select(
				"conversationId sender senderModel text createdAt isRead metadata"
			)
			.lean();

		res.status(200).json({
			success: true,
			messages: allMessages,
		});
	} catch (error) {
		console.error("❌ Error in getAllMessages:", error);
		res.status(500).json({
			success: false,
			message: "Failed to fetch all messages.",
		});
	}
};

const getUsersWithLastMessage = async (req, res) => {
	try {
		// ✅ Use req.admin.id from the auth middleware
		if (!req.admin || !req.admin.id) {
			return res.status(403).json({
				success: false,
				message: "Access denied. Admin ID not found.",
			});
		}
		const adminId = String(req.admin.id);

		// 1. Find all conversations where the current admin is a participant
		const conversations = await Conversation.find({
			"participants.id": adminId,
		});

		if (conversations.length === 0) {
			return res.status(200).json({ success: true, users: [] });
		}

		// Extract all unique user IDs from these conversations (excluding the admin's ID)
		const userIdsInConversations = conversations
			.flatMap((conv) =>
				conv.participants
					.filter((p) => p.model === "User") // Only interested in User participants
					.map((p) => p.id)
			)
			.filter((id, index, self) => self.indexOf(id) === index); // Get unique IDs

		if (userIdsInConversations.length === 0) {
			return res.status(200).json({ success: true, users: [] });
		}

		// 2. Fetch the last message for each of these conversations
		const lastMessages = await Message.aggregate([
			{
				// Filter messages to only those belonging to the identified conversations
				$match: {
					conversationId: { $in: conversations.map((c) => c._id) },
				},
			},
			{ $sort: { createdAt: -1 } }, // Sort by most recent
			{
				$group: {
					_id: "$conversationId", // Group by conversation to get the last message for each
					lastMessageText: { $first: "$text" },
					lastMessageTime: { $first: "$createdAt" },
					senderId: { $first: "$sender" }, // The actual sender of the last message
					senderModel: { $first: "$senderModel" },
					receiverId: { $first: "$receiver" }, // The actual receiver of the last message
					receiverModel: { $first: "$receiverModel" },
					conversation: { $first: "$$ROOT" }, // Keep the full document for subsequent stages
				},
			},
			{
				$lookup: {
					from: "conversations",
					localField: "_id",
					foreignField: "_id",
					as: "conversationInfo",
				},
			},
			{ $unwind: "$conversationInfo" },
			{
				// Project the user's ID within this conversation (the one who isn't the admin)
				$addFields: {
					chattingUserId: {
						$let: {
							vars: {
								participant1: {
									$arrayElemAt: ["$conversationInfo.participants", 0],
								},
								participant2: {
									$arrayElemAt: ["$conversationInfo.participants", 1],
								},
							},
							in: {
								$cond: {
									if: { $eq: ["$$participant1.id", adminId] },
									then: "$$participant2.id",
									else: "$$participant1.id",
								},
							},
						},
					},
					// Determine if there are new messages for the admin
					hasNewMessages: {
						$cond: {
							// If the last message was sent by the user AND is unread
							if: {
								$and: [
									{ $eq: ["$senderId", "$chattingUserId"] }, // Last message from the user
									{ $eq: ["$conversation.isRead", false] }, // Check the actual message's isRead status
								],
							},
							then: true,
							else: false,
						},
					},
				},
			},
			{
				// Lookup user info for the chatting user
				$lookup: {
					from: "users", // Assuming your User model's collection name is 'users'
					localField: "chattingUserId",
					foreignField: "_id",
					as: "userInfo",
				},
			},
			{ $unwind: "$userInfo" }, // Deconstruct the userInfo array
			{
				$project: {
					_id: 0, // Exclude _id from the final output
					userId: "$chattingUserId",
					name: "$userInfo.name",
					email: "$userInfo.email",
					lastMessage: "$lastMessageText",
					lastMessageTime: "$lastMessageTime",
					hasNewMessages: 1, // Include the hasNewMessages flag
				},
			},
		]);

		return res.status(200).json({ success: true, users: lastMessages });
	} catch (error) {
		console.error("❌ Error in getUsersWithLastMessage:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch users with last message.",
		});
	}
};

const deleteChat = async (req, res) => {
	try {
		// ✅ 1. Authorization: Only allow Admins to perform this action
		if (!req.admin || !req.admin.id) {
			return res.status(403).json({
				success: false,
				message: "Access denied. Only administrators can delete chats.",
			});
		}

		const { userIdToDeleteChatWith } = req.params; // The ID of the user whose chat with the admin will be deleted

		if (!userIdToDeleteChatWith) {
			return res.status(400).json({
				success: false,
				message: "User ID to delete chat with is required.",
			});
		}

		const adminId = String(req.admin.id);
		const targetUserId = String(userIdToDeleteChatWith);

		// ✅ 2. Find the specific conversation between the admin and the target user
		const conversation = await Conversation.findOne({
			$and: [
				{ "participants.id": adminId },
				{ "participants.id": targetUserId },
			],
		});

		if (!conversation) {
			return res.status(404).json({
				success: false,
				message: "No conversation found between this admin and user.",
			});
		}

		// ✅ 3. Delete all messages associated with this conversation
		const deleteMessagesResult = await Message.deleteMany({
			conversationId: conversation._id,
		});

		// ✅ 4. Delete the conversation itself
		const deleteConversationResult = await Conversation.deleteOne({
			_id: conversation._id,
		});

		// ✅ 5. Respond with success
		res.status(200).json({
			success: true,
			message: `Chat with user ${userIdToDeleteChatWith} successfully deleted.`,
			messagesDeletedCount: deleteMessagesResult.deletedCount,
			conversationDeleted: deleteConversationResult.deletedCount > 0,
		});
	} catch (error) {
		console.error("❌ deleteChat error:", error);
		res.status(500).json({
			success: false,
			message: "Failed to delete chat due to a server error.",
		});
	}
};

module.exports = {
	sendMessage,
	getConversationMessages,
	getUnreadCount,
	getUsersWithLastMessage,
	getAllMessages,
	deleteChat,
};
