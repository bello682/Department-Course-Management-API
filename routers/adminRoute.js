const { Router } = require("express");
const {
	registerAdmin,
	verifyOtp,
	resendOtp,
	loginAdmin,
	forgotPassword,
	resetPassword,
	fetchAdmin,
	createCourse,
	getAllCourses,
	updateCourse,
	deleteCourse,
	deleteUser,
	logoutAdmin,
	getAllUsers,
	getAdminPublicId,
} = require("../controllers/adminController");

const adminMiddleware = require("../middlewares/adminMiddleware");

const router = Router();

// ✅ Public routes (no token needed)
router.post("/register", registerAdmin);
router.post("/login", loginAdmin);
router.post("/logout", adminMiddleware, logoutAdmin);
router.post("/verify-otp", adminMiddleware, verifyOtp);
router.get("/getAdmin", adminMiddleware, fetchAdmin);
router.post("/resend-otp", adminMiddleware, resendOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// ✅ Protected routes (require token & admin)
router.post("/courses", adminMiddleware, createCourse);
router.get("/courses", adminMiddleware, getAllCourses);
router.put("/courses/:courseId", adminMiddleware, updateCourse);
router.delete("/courses/:courseId", adminMiddleware, deleteCourse);
router.get("/getDepartments-by-admin", adminMiddleware, getAllUsers);
router.delete("/user/:userId", adminMiddleware, deleteUser);

// sending admin publicly and no token or auth middleware
router.get("/public-admin-id", getAdminPublicId);

module.exports = router;
