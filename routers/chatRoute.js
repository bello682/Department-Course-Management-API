const express = require("express");
const router = express.Router();
const {
	sendMessage,
	getConversationMessages,
	getUnreadCount,
	getUsersWithLastMessage,
	getAllMessages,
	deleteChat,
} = require("../controllers/chatController");

const userAuth = require("../middlewares/userMiddleware");
const adminAuth = require("../middlewares/adminMiddleware");

// ✅ Allow authenticated users/admins to send messages
router.post("/send", userAuth, sendMessage); // User to admin
router.post("/send/admin", adminAuth, sendMessage); // Admin to user

router.get("/history/:userId", userAuth, getConversationMessages);
router.get("/admin/history/:userId", adminAuth, getConversationMessages);

//
router.get("/user/unread-count", userAuth, getUnreadCount);
router.get("/unread-count", adminAuth, getUnreadCount);

router.get("/users-with-last-message", adminAuth, getUsersWithLastMessage);

router.get("/admin/messages/all", adminAuth, getAllMessages);
router.delete("/:userIdToDeleteChatWith", adminAuth, deleteChat);

module.exports = router;
