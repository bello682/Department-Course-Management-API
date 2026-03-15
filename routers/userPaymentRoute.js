const { Router } = require("express");

const {
	applyAndPayForCourse,
	getMyCourses,
	getMyReceipts,
	getTotalAmountPaid,
} = require("../controllers/userPaymentController");

const userAuthMiddleware = require("../middlewares/userMiddleware");

const router = Router();

router.post("/apply-and-pay", userAuthMiddleware, applyAndPayForCourse);
router.get("/my-courses", userAuthMiddleware, getMyCourses);
router.get("/my-receipts", userAuthMiddleware, getMyReceipts);
router.get("/my-total", userAuthMiddleware, getTotalAmountPaid);

module.exports = router;
