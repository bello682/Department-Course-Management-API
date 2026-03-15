// let restructure the chat today now i want to restructure the backend to only chat between the user that is registered and admin no need for guest just user and admin, using socket.io, will paste you my backend now and you will restructure all

// const express = require("express");
// const cors = require("cors");
// const { connect } = require("mongoose");
// require("dotenv").config();
// const fileUpload = require("express-fileupload");

// const http = require("http");
// const socketIO = require("socket.io");

// const userRoute = require("./routers/userRouter");
// const adminRoute = require("./routers/adminRoute");
// const userPaymentRoutes = require("./routers/userPaymentRoute");
// const publicCourseRoutes = require("./routers/publicCourseRoute");
// const chatRoutes = require("./routers/chatRoute");
// const chatSocketHandler = require("./sockets/chatSocket");

// const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

// const app = express();
// const server = http.createServer(app); // 👈 Attach server
// const io = socketIO(server, {
// 	cors: {
// 		origin: "*", // Adjust for production
// 		methods: ["GET", "POST"],
// 	},
// });

// // ✅ Attach socket handlers
// chatSocketHandler(io);

// // 📦 Middleware
// app.use(express.json({ extended: true }));
// app.use(express.urlencoded({ extended: true }));
// app.use(
// 	cors({
// 		credentials: true,
// 		origin: function (origin, callback) {
// 			const allowedOrigins = [
// 				"http://localhost:5173",
// 				"http://localhost:3000",
// 				"https://frontend-heavy-task.vercel.app",
// 				"*",
// 			];
// 			if (!origin || allowedOrigins.includes(origin)) {
// 				callback(null, true);
// 			} else {
// 				callback(new Error("Not allowed by CORS"));
// 			}
// 		},
// 	})
// );

// // Configure express-fileupload with temp files support
// app.use(
// 	fileUpload({
// 		useTempFiles: true,
// 		tempFileDir: "/tmp/", // Temporary directory for file uploads
// 	})
// );

// // 🔗 Routes
// app.use("/api_url/users/task", userRoute);
// app.use("/api_url/users/task/admin", adminRoute);
// app.use("/api_url/users/task/user-payment", userPaymentRoutes);
// app.use("/api_url/users/task/public-courses", publicCourseRoutes);
// app.use("/api_url/users/task/chat", chatRoutes);

// app.use(notFound);
// app.use(errorHandler);

// // 🚀 Connect DB and Start Server
// const dataBaseConnection = async () => {
// 	try {
// 		await connect(process.env.MONGODB_URL);
// 		console.log("✅ Database connected");

// 		const PORT = process.env.PORT || 5000;
// 		server.listen(PORT, () => {
// 			console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
// 		});
// 	} catch (err) {
// 		console.error("❌ DB connection error:", err);
// 	}
// };

// dataBaseConnection();

// // === src/sockets/chatSocket.js ===
// const mongoose = require("mongoose"); // make sure it's required
// const ChatMessage = require("../models/message");
// const Conversation = require("../models/conversation");

// const chatSocketHandler = (io) => {
// 	io.on("connection", (socket) => {
// 		console.log("🔌 User connected:", socket.id);

// 		socket.on("join", ({ userId, role, name, email }) => {
// 			const room = userId || email || socket.id;
// 			socket.join(room);
// 			console.log(`🟢 ${role} joined room: ${room}`);
// 		});

// 		socket.on("sendMessage", async (data) => {
// 			try {
// 				const { senderId, receiverId, text, name, email, role } = data;
// 				const senderModel = role || "Guest";

// 				let conversation = await Conversation.findOne({
// 					$and: [
// 						{ participants: { $elemMatch: { id: senderId } } },
// 						{ participants: { $elemMatch: { id: receiverId } } },
// 					],
// 				});

// 				// ✅ Fix: pass full participant objects
// 				if (!conversation) {
// 					conversation = await Conversation.create({
// 						participants: [
// 							{ id: senderId, model: senderModel },
// 							{
// 								id: receiverId,
// 								model: senderModel === "Admin" ? "User" : "Admin",
// 							},
// 						],
// 					});
// 				}

// 				// ✅ sender should be full string or ObjectId based on schema (yours allows Mixed)
// 				const messageDoc = new ChatMessage({
// 					conversationId: conversation._id,
// 					sender: senderId,
// 					senderModel,
// 					text,
// 					metadata: { name, email },
// 					createdAt: new Date(),
// 				});

// 				const saved = await messageDoc.save();

// 				const payload = {
// 					id: saved._id,
// 					senderModel,
// 					text: saved.text,
// 					time: new Date(saved.createdAt).toLocaleTimeString([], {
// 						hour: "2-digit",
// 						minute: "2-digit",
// 					}),
// 				};

// 				io.to(receiverId).emit("receiveMessage", payload);
// 				io.to(senderId).emit("receiveMessage", payload);
// 			} catch (error) {
// 				console.error("❌ Socket sendMessage error:", error.message);
// 			}
// 		});

// 		socket.on("disconnect", () => {
// 			console.log("🔌 User disconnected:", socket.id);
// 		});
// 	});
// };

// module.exports = chatSocketHandler;

// const express = require("express");
// const router = express.Router();
// const {
// 	sendMessage,
// 	getConversationMessages,
// 	getUnreadCount,
// 	getUsersWithLastMessage,
// 	getAllMessages,
// } = require("../controllers/chatController");

// const userAuth = require("../middlewares/userMiddleware");
// const adminAuth = require("../middlewares/adminMiddleware");

// // ✅ Allow guests and authenticated users/admins to send messages
// router.post("/send", sendMessage);

// router.get("/history/:userId", getConversationMessages);

// //
// // router.get("/unread-count", userAuth, getUnreadCount);
// router.get("/unread-count", adminAuth, getUnreadCount);

// router.get("/users-with-last-message", adminAuth, getUsersWithLastMessage);

// router.get("/admin/messages/all", getAllMessages);

// module.exports = router;

// const mongoose = require("mongoose");

// const messageSchema = new mongoose.Schema(
// 	{
// 		conversationId: {
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: "Conversation",
// 			required: true,
// 		},
// 		sender: {
// 			type: mongoose.Schema.Types.Mixed, // ✅ allow ObjectId or UUID string
// 			required: true,
// 		},
// 		senderModel: {
// 			type: String,
// 			enum: ["Department", "Admin", "User", "Guest"],
// 			required: true,
// 		},
// 		text: {
// 			type: String,
// 			required: true,
// 		},
// 		isRead: {
// 			type: Boolean,
// 			default: false,
// 		},
// 		metadata: {
// 			type: Object,
// 			default: {},
// 		},
// 	},
// 	{ timestamps: true }
// );

// module.exports = mongoose.model("Message", messageSchema);

// const mongoose = require("mongoose");

// const conversationSchema = new mongoose.Schema(
// 	{
// 		participants: [
// 			{
// 				id: {
// 					type: mongoose.Schema.Types.Mixed, // ✅ allows ObjectId or UUID
// 					required: true,
// 				},
// 				model: {
// 					type: String,
// 					required: true,
// 					enum: ["Department", "Admin", "User", "Guest"],
// 				},
// 			},
// 		],
// 	},
// 	{ timestamps: true }
// );

// module.exports = mongoose.model("Conversation", conversationSchema);

// const mongoose = require("mongoose");
// const { Types } = require("mongoose");
// const { ObjectId } = require("mongoose").Types;

// const Conversation = require("../models/conversation");
// const Message = require("../models/message");

// // Send a message (user or admin)
// const sendMessage = async (req, res) => {
// 	try {
// 		const {
// 			senderId, // optional (for guest)
// 			receiverId,
// 			text,
// 			name = "Guest",
// 			email = "",
// 		} = req.body;

// 		if (!receiverId || !text) {
// 			return res
// 				.status(400)
// 				.json({ message: "receiverId and text are required" });
// 		}

// 		// Determine sender details
// 		let finalSenderId = senderId;
// 		let senderModel = "Guest";

// 		if (req.user) {
// 			finalSenderId = req.user.id;
// 			senderModel = req.user.role === "department" ? "Department" : "User";
// 		}

// 		if (req.admin) {
// 			finalSenderId = req.admin.id;
// 			senderModel = "Admin";
// 		}

// 		// Ensure all IDs are treated as strings
// 		const senderStr = String(finalSenderId);
// 		const receiverStr = String(receiverId);

// 		// Find existing conversation using string comparison
// 		let conversation = await Conversation.findOne({
// 			$and: [
// 				{ participants: { $elemMatch: { id: senderStr } } },
// 				{ participants: { $elemMatch: { id: receiverStr } } },
// 			],
// 		});

// 		// If no conversation exists, create one
// 		if (!conversation) {
// 			conversation = await Conversation.create({
// 				participants: [
// 					{ id: senderStr, model: senderModel },
// 					{
// 						id: receiverStr,
// 						model: senderModel === "Admin" ? "User" : "Admin",
// 					},
// 				],
// 			});
// 		}

// 		// Create and save the message
// 		const message = await Message.create({
// 			conversationId: conversation._id,
// 			sender: senderStr,
// 			senderModel,
// 			text,
// 			metadata: { name, email },
// 		});

// 		res.status(201).json({ message: "Message sent", data: message });
// 	} catch (error) {
// 		console.error("❌ sendMessage error:", error);
// 		res.status(500).json({ message: "Failed to send message" });
// 	}
// };

// // Get all messages between a user and admin
// const getConversationMessages = async (req, res) => {
// 	try {
// 		const { userId } = req.params;
// 		const authUserId = req.user?.id || req.admin?.id || req.query.senderId;

// 		console.log("authUserId:", authUserId);
// 		console.log("userId:", userId);

// 		if (!authUserId) {
// 			return res.status(403).json({ message: "Unauthorized request" });
// 		}

// 		// Convert both IDs to strings to match stored participant.id type
// 		const userIdStr = String(userId);
// 		const authUserIdStr = String(authUserId);

// 		const conversation = await Conversation.findOne({
// 			$and: [
// 				{ "participants.id": authUserIdStr },
// 				{ "participants.id": userIdStr },
// 			],
// 		});

// 		if (!conversation) {
// 			return res.status(404).json({ message: "No conversation found" });
// 		}

// 		const messages = await Message.find({ conversationId: conversation._id })
// 			.sort({ createdAt: 1 })
// 			.populate("sender", "name email");

// 		await Message.updateMany(
// 			{
// 				conversationId: conversation._id,
// 				sender: { $ne: authUserIdStr },
// 				isRead: false,
// 			},
// 			{ $set: { isRead: true } }
// 		);

// 		res.status(200).json({ messages });
// 	} catch (error) {
// 		console.error("Get Conversation Message Error:", error);
// 		res.status(500).json({
// 			success: false,
// 			message: "Failed to load messages",
// 		});
// 	}
// };

// const getUnreadCount = async (req, res) => {
// 	try {
// 		const userId = req.user._id;
// 		const userModel = req.user.role === "admin" ? "Admin" : "Department";

// 		const unreadMessages = await Message.countDocuments({
// 			isRead: false,
// 			$nor: [{ sender: userId, senderModel: userModel }],
// 			senderModel: { $in: ["User", "Guest"] },
// 		});

// 		res.status(200).json({ unreadCount: unreadMessages });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ message: "Failed to get unread count" });
// 	}
// };

// const getAllMessages = async (req, res) => {
// 	try {
// 		if (req.headers.role !== "admin") {
// 			return res.status(403).json({
// 				success: false,
// 				message: "Access denied.",
// 			});
// 		}

// 		const allMessages = await Message.find({}).sort({ createdAt: -1 }).lean();

// 		return res.status(200).json({
// 			success: true,
// 			messages: allMessages,
// 		});
// 	} catch (error) {
// 		console.error("❌ Error in getAllMessages:", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: "Failed to fetch all messages.",
// 		});
// 	}
// };

// const getUsersWithLastMessage = async (req, res) => {
// 	try {
// 		if (req.headers.role !== "admin") {
// 			return res
// 				.status(403)
// 				.json({ success: false, message: "Access denied." });
// 		}

// 		const lastMessages = await Message.aggregate([
// 			{ $sort: { createdAt: -1 } },
// 			{
// 				$addFields: {
// 					chatUserId: {
// 						$cond: {
// 							if: { $in: ["$senderModel", ["User", "Guest"]] },
// 							then: "$sender",
// 							else: "$receiver",
// 						},
// 					},
// 					isGuest: { $eq: ["$senderModel", "Guest"] },
// 				},
// 			},
// 			{
// 				$group: {
// 					_id: "$chatUserId",
// 					lastMessage: { $first: "$text" },
// 					lastMessageTime: { $first: "$createdAt" },
// 					senderModel: { $first: "$senderModel" },
// 					metadata: { $first: "$metadata" },
// 				},
// 			},
// 			{
// 				$lookup: {
// 					from: "users",
// 					localField: "_id",
// 					foreignField: "_id",
// 					as: "userInfo",
// 				},
// 			},
// 			{
// 				$project: {
// 					userId: "$_id",
// 					name: {
// 						$cond: {
// 							if: { $eq: ["$senderModel", "Guest"] },
// 							then: "$metadata.name",
// 							else: { $arrayElemAt: ["$userInfo.name", 0] },
// 						},
// 					},
// 					email: {
// 						$cond: {
// 							if: { $eq: ["$senderModel", "Guest"] },
// 							then: "$metadata.email",
// 							else: { $arrayElemAt: ["$userInfo.email", 0] },
// 						},
// 					},
// 					lastMessage: 1,
// 					lastMessageTime: 1,
// 					hasNewMessages: { $literal: false },
// 				},
// 			},
// 		]);

// 		return res.status(200).json({ success: true, users: lastMessages });
// 	} catch (error) {
// 		console.error("❌ Error in getUsersWithLastMessage:", error);
// 		return res.status(500).json({
// 			success: false,
// 			message: "Failed to fetch users with last message.",
// 		});
// 	}
// };

// module.exports = {
// 	sendMessage,
// 	getConversationMessages,
// 	getUnreadCount,
// 	getUsersWithLastMessage,
// 	getAllMessages,
// };

// const jwt = require("jsonwebtoken");
// const Admin = require("../models/adminModel");
// const HttpError = require("../models/errorModel");

// const adminAuthMiddleware = async (req, res, next) => {
// 	try {
// 		const token = req.headers.authorization?.split(" ")[1];
// 		if (!token) return next(new HttpError("No token, access denied", 401));

// 		const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);

// 		const admin = await Admin.findById(decoded.userId); // ✅ Use userId instead of id
// 		if (!admin)
// 			return next(new HttpError("Invalid token or admin not found", 401));

// 		req.admin = {
// 			id: admin._id,
// 			email: decoded.email,
// 			role: decoded.role,
// 		};

// 		next();
// 	} catch (error) {
// 		console.error("Admin protect error:", error);
// 		return next(new HttpError("Token verification failed", 401));
// 	}
// };

// module.exports = adminAuthMiddleware;

// const jwt = require("jsonwebtoken");
// const HttpError = require("../models/errorModel");
// const Users = require("../models/userModel");

// const userAuthMiddleware = async (req, res, next) => {
// 	const authHeader = req.headers.authorization;

// 	if (!authHeader || !authHeader.startsWith("Bearer ")) {
// 		return next(new HttpError("Unauthorized. No token provided.", 401));
// 	}

// 	const token = authHeader.split(" ")[1];

// 	try {
// 		const decodedToken = jwt.verify(
// 			token,
// 			process.env.JSON_WEB_TOKEN_SECRET_KEY
// 		);

// 		if (decodedToken.role !== "user") {
// 			return next(new HttpError("Access forbidden: user only.", 403));
// 		}

// 		if (!decodedToken.userId) {
// 			return next(new HttpError("User ID not found in token.", 401));
// 		}

// 		// req.user = { id: decodedToken.userId, email: Users.email, role: "user" };
// 		req.user = {
// 			id: decodedToken.userId,
// 			email: decodedToken.email,
// 			role: "user",
// 		};

// 		next();
// 	} catch (error) {
// 		if (error.name === "TokenExpiredError") {
// 			console.log("TokenExpiredError:", error);
// 			return next(new HttpError("Token expired. Please log in again.", 401));
// 		} else {
// 			return next(new HttpError("Invalid token. Please log in again.", 401));
// 		}
// 	}
// };

// module.exports = userAuthMiddleware;
