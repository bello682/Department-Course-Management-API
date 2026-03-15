const moment = require("moment");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const HttpError = require("../models/errorModel");
const { v4: uuid } = require("uuid");
const User = require("../models/userModel");
const { generateToken } = require("../auth/genarateToken");
const { generateOTP } = require("../utils/generateNumbers");
const {
  sendEmailMessage,
  sendUserOTPEmail,
  sendWelcomeEmailToUser,
  sendUserPasswordResetEmail,
  sendLoginNotificationEmail,
} = require("../emails/agentEmails/sendAgentA-RequestEmail");

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper functions for validations
const isEmailValid = (email) => /\S+@\S+\.\S+/.test(email);
const isPasswordValid = (password) => password.length >= 8;

// POST: Register user
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    if (!name || name.trim().length < 2) {
      return next(new HttpError("Name must be at least 2 characters", 400));
    }

    const nameParts = name.trim().split(/\s+/); // at least 2 words (john doe)
    if (nameParts.length < 2) {
      return next(
        new HttpError("Please enter at least first name and last name", 400),
      );
    }

    if (!email) {
      console.error("Email field is missing");
      return next(new HttpError("Email field is required.", 400));
    }
    if (!phoneNumber) {
      console.error("PhoneNumber field is missing");
      return next(new HttpError("PhoneNumber field is required.", 400));
    }

    if (!password) {
      console.error("Password field is missing");
      return next(new HttpError("Password field is required.", 400));
    }

    if (!isEmailValid(email)) {
      return next(new HttpError("Invalid email format.", 400));
    }
    if (!isPasswordValid(password)) {
      return next(
        new HttpError("Password must be at least 8 characters long.", 400),
      );
    }

    // ==== instead of checking for both like this i will singlely insert both together to check if the email or phonenumber already exist there ======
    // const existing = await User.findOne({ phoneNumber: req.body.phoneNumber });
    // if (existing) {
    // 	return res.status(400).json({ message: "Phone number already exists" });
    // }

    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    // 	return next(new HttpError("User already exists", 400));
    // }

    // ========= Use this instead =========
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return next(new HttpError("User with this email already exists", 400));
      } else if (existingUser.phoneNumber === phoneNumber) {
        return next(new HttpError("Phone number already exists", 400));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // const deviceId = uuid();
    const deviceId = `${uuid()}-${
      req.headers["user-agent"] || "unknown-device"
    }`;
    const otp = generateOTP();
    const otpExpiresAt = Date.now() + 5 * 60 * 1000;

    const newUser = await User.create({
      name: name.trim(),
      email,
      phoneNumber,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false,
      role: "user",
      deviceId,
    });
    // await sendUserOTPEmail(newUser.email, otp, newUser.name);

    // incase there is error from email then delete the user that was created earlier since they where unable to register

    try {
      await sendUserOTPEmail(newUser.email, otp, newUser.name);
    } catch (emailError) {
      // 🧹 Rollback the user creation if sending email fails
      await User.findByIdAndDelete(newUser._id);
      console.error("Email sending failed. User deleted.");
      return next(
        new HttpError("Failed to send verification email. Try again.", 500),
      );
    }

    const { accessToken, refreshToken } = generateToken(newUser);

    res.status(201).json({
      success: true, // this help the frontend check when using axios for consuming the data on submit
      message: `Registration successful. Verify with the OTP sent to ${newUser.email}.`,
      accessToken,
      refreshToken,
      deviceId,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        PhoneNumber: newUser.phoneNumber,
        role: newUser.role,
        status: newUser.status,
        verification_status: newUser.verification_status,
        isVerified: newUser.isVerified,
      },
    });
  } catch (err) {
    console.log(err);

    next(new HttpError("User registration failed", 500));
  }
};

// POST: Verify OTP
const VerifyUserByOtp = async (req, res, next) => {
  const { otp } = req.body || {};
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp || user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // send welcoming Email notification message
    await sendWelcomeEmailToUser(user.email, user.name);

    // Generate token after successful verification
    const { accessToken, refreshToken } = generateToken(user); // Pass the whole user object

    res.json({
      success: true,
      message: "User verified successfully",
      accessToken: accessToken, // Return the new token
      refreshToken: refreshToken,
      user: user,
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    next(new HttpError("OTP verification failed, please try again.", 500));
  }
};

// POST: Resend OTP
const ResendOTP = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new HttpError("User with this email not found.", 404));
    }
    if (user.isVerified) {
      return next(new HttpError("User already verified.", 400));
    }

    const newOtp = generateOTP();
    const otpExpiresAt = Date.now() + 5 * 60 * 1000;

    user.otp = newOtp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    await sendUserOTPEmail(email, newOtp);

    // Generate a new token
    const { accessToken, refreshToken } = generateToken({
      _id: user._id,
      email: user.email,
      role: user.role,
    });

    res.json({
      success: true,
      message: "A new OTP has been sent to your email.",
      accessToken: accessToken, // Return the new token
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.error("Error resending OTP:", err);
    next(new HttpError("Failed to resend OTP, please try again.", 500));
  }
};

// POST: Login user
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new HttpError("Email and password are required.", 400));
    }
    if (!isEmailValid(email)) {
      return next(new HttpError("Invalid email format.", 400));
    }

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return next(new HttpError("Invalid email or password.", 401));
    }

    if (!user.isVerified) {
      return next(
        new HttpError("Please verify your email before logging in.", 403),
      );
    }

    if (!user.timeOfActive) {
      user.timeOfActive = moment().toDate(); // Current time when the user logs in
    }

    // destructuring the user
    const { uPassword, ...userInformations } = user;

    // Update activeDateAndTime
    user.activeDateAndTime = moment().format("YYYY-MM-DD HH:mm:ss");
    user.timeOfActive = moment().toDate();
    user.lastLogin = moment().toDate();
    user.status = "active";
    user.date_updated = moment().format("YYYY-MM-DD HH:mm:ss");
    await user.save();

    // Generate token using the new function
    const { accessToken, refreshToken } = generateToken(user);
    // Send login notification email
    await sendLoginNotificationEmail(user.email, {
      fullName: user.name,
      loginTime: new Date().toLocaleString(),
      fraudAlertLink: `https://frontend-heavy-task.vercel.app/security-alert?id=${user._id}`,
      // Replace with your actual fraud alert link
    });

    const userResponse = user.toObject();
    delete userResponse.password; // Securely remove password before sending
    res.status(200).json({
      success: true,
      message: "Login successful",
      userData_Spread: userInformations,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.name,
        role: user.role,
        status: user.status,
      },
      accessToken: accessToken, // Return the new token
      refreshToken: refreshToken,
    });
  } catch (err) {
    console.error("Error during User login:", err);
    next(new HttpError("Login failed, please try again.", 500));
  }
};

// Logout User

const logoutUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      console.log("No user", user, userId);
      return next(new HttpError("User not found.", 404));
    }

    user.status = "inactive";
    user.date_updated = moment().format("YYYY-MM-DD HH:mm:ss");
    await user.save();

    res
      .status(200)
      .json({ success: true, message: `${user.email} Logout successful` });
  } catch (err) {
    console.error("Error during admin logout:", err);
    next(new HttpError("Logout failed, please try again.", 500));
  }
};

// POST request for forgetting password
const ForgetPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return next(new HttpError("User not found.", 404));
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await sendUserPasswordResetEmail(email, resetToken);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email.",
      resetToken,
    });
  } catch (err) {
    console.error("Error during password reset:", err);
    next(
      new HttpError(
        "Failed to send password reset link, please try again.",
        500,
      ),
    );
  }
};

// POST request to reset the password
const ResetPassword = async (req, res, next) => {
  const { newPassword } = req.body;
  const token = req.params.token;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!newPassword || typeof newPassword !== "string") {
      return next(
        new HttpError("New password is required and must be a string.", 400),
      );
    }

    if (!user) {
      return next(new HttpError("Invalid or expired token.", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successful." });
  } catch (err) {
    console.error("Error resetting password:", err);
    next(new HttpError("Failed to reset password, please try again.", 500));
  }
};

// Get user
const fetchUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return next(new HttpError("User ID not found", 400));
    }

    const user = await User.findById(userId);

    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: { user: user },
    });
  } catch (err) {
    console.error("Error in getUser:", err);
    next(new HttpError("Failed to retrieve user", 500));
  }
};

// (Put) Update user
const updateUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!userId) {
      return next(new HttpError("User ID not found", 400));
    }

    if (!name || name.trim().length < 2) {
      return next(new HttpError("Name must be at least 2 characters", 400));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true },
    );

    if (!updatedUser) {
      return next(new HttpError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: { user: updatedUser },
    });
  } catch (err) {
    console.error("Error in updateUser:", err);
    next(new HttpError("Failed to update user", 500));
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return next(new HttpError("User ID not found", 400));
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return next(new HttpError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteUser:", err);
    next(new HttpError("Failed to delete user", 500));
  }
};

module.exports = {
  registerUser,
  VerifyUserByOtp,
  ResendOTP,
  loginUser,
  ForgetPassword,
  ResetPassword,
  logoutUser,
  fetchUser,
  updateUser,
  deleteUser,
};
