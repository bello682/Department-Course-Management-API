const { Router } = require("express");

const {
	registerUser,
	VerifyUserByOtp,
	ResendOTP,
	loginUser,
	logoutUser,
	ForgetPassword,
	ResetPassword,
	fetchUser,
	updateUser,
	deleteUser,
} = require("../controllers/userController");

const userAuthMiddleware = require("../middlewares/userMiddleware");

const router = Router();

router.post("/register", registerUser);
// User verify user by email route
router.post("/verifyUser-otp", userAuthMiddleware, VerifyUserByOtp);
// User resend OTP route
router.post("/resendUser-otp", userAuthMiddleware, ResendOTP);
// User forget password route
router.post("/forgot-password", ForgetPassword);

// User reset password route
router.post("/reset-password/:token", ResetPassword);
router.post("/login", loginUser);
router.post("/logout", userAuthMiddleware, logoutUser);
router.get("/getDepartments", userAuthMiddleware, fetchUser);
// router.get("/getDepartments-by-admin", fetchUser); // this is to be used by the admin to get all user without epecting a validation Auth
router.put("/updateDepartment", userAuthMiddleware, updateUser);
router.delete("/deleteDepartment", userAuthMiddleware, deleteUser);

module.exports = router;
