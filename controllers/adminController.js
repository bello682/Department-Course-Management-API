const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;
const HttpError = require("../models/errorModel");
const Admin = require("../models/adminModel");
const crypto = require("crypto");
const Course = require("../models/courses");
const moment = require("moment");
const User = require("../models/userModel");
const {
	sendUserOTPEmail,
	sendWelcomeEmailToUser,
	sendAdminPasswordResetEmail,
} = require("../emails/agentEmails/sendAgentA-RequestEmail");

// Cloudinary configuration
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper to generate JWT
// New (detailed payload)
const generateToken = (userId, email, role) => {
	const accessToken = jwt.sign(
		{ userId, email, role },
		process.env.JSON_WEB_TOKEN_SECRET_KEY,
		{
			expiresIn: "7h",
		}
	);
	const refreshToken = jwt.sign(
		{ userId, email, role },
		process.env.JSON_WEB_TOKEN_SECRET_KEY,
		{
			expiresIn: "7h",
		}
	);

	return { accessToken, refreshToken };
};

// Register Admin
const registerAdmin = async (req, res, next) => {
	try {
		const { name, email, phoneNumber, password } = req.body;

		if (!name || !email || !phoneNumber || !password)
			return res.status(400).json({ message: "All fields are required" });

		const existing = await Admin.findOne({ email });
		if (existing)
			return res.status(400).json({ message: "Admin already exists" });

		const hashed = await bcrypt.hash(password, 10);

		// Simulate OTP send (can replace with real email later)
		const otp = Math.floor(100000 + Math.random() * 900000).toString();

		const newAdmin = await Admin.create({
			name,
			email,
			phoneNumber,
			password: hashed,
			// role,
		});

		console.log("newUser received", newAdmin);

		newAdmin.otp = otp;
		newAdmin.otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
		try {
			await sendUserOTPEmail(newAdmin.email, otp, newAdmin.name);
		} catch (emailError) {
			// 🧹 Rollback the user creation if sending email fails
			await Admin.findByIdAndDelete(newAdmin._id);
			console.error("Email sending failed. User deleted.");
			return next(
				new HttpError("Failed to send verification email. Try again.", 500)
			);
		}

		await newAdmin.save();

		// because the generate token we are using above expect the three parameter
		const { accessToken, refreshToken } = generateToken(
			newAdmin._id,
			newAdmin.email,
			newAdmin.role
		);

		return res.status(201).json({
			success: true,
			message: `Admin Registration successful. Verify with the OTP sent to ${newAdmin.email}.`,
			accessToken: accessToken, // Return the new token
			refreshToken: refreshToken,
			user: {
				id: newAdmin._id,
				name: newAdmin.name,
				email: newAdmin.email,
				PhoneNumber: newAdmin.phoneNumber,
				role: newAdmin.role,
				isVerified: newAdmin.isVerified,
			},
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Registration failed" });
	}
};

// Verify OTP
const verifyOtp = async (req, res) => {
	const { otp } = req.body || {};
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "No token provided" });
	}
	try {
		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
		const admin = await Admin.findOne({ email: decoded.email });

		if (!admin || admin.otp !== otp || admin.otpExpiresAt < new Date())
			return res.status(400).json({ message: "Invalid or expired OTP" });

		admin.isVerified = true;
		admin.otp = null;
		admin.otpExpiresAt = null;
		await admin.save();

		// send welcoming Email notification message
		await sendWelcomeEmailToUser(admin.email, admin.name);

		// Generate token after successful verification
		const { accessToken, refreshToken } = generateToken(
			admin._id,
			admin.email,
			admin.role
		); // Pass the whole admin three parameter  object

		return res.status(200).json({
			success: true,
			message: "Admin verified successfully",
			accessToken: accessToken, // Return the new token
			refreshToken: refreshToken,
			admin: admin,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "OTP verification failed" });
	}
};

// Resend OTP
const resendOtp = async (req, res) => {
	try {
		const { email } = req.body;
		const admin = await Admin.findOne({ email });
		if (!admin) return res.status(404).json({ message: "Admin not found" });

		const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
		const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

		admin.otp = newOtp;
		admin.otpExpiresAt = otpExpiresAt;
		await admin.save();

		await sendUserOTPEmail(admin.email, newOtp, admin.name);

		const { accessToken, refreshToken } = generateToken(
			admin._id,
			admin.email,
			admin.role
		); // Pass the whole admin three parameter  object

		return res.status(200).json({
			success: true,
			message: "OTP resent successfully",
			accessToken: accessToken, // Return the new token
			refreshToken: refreshToken,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "OTP resend failed" });
	}
};

// Admin Login
const loginAdmin = async (req, res) => {
	try {
		const { email, password } = req.body;
		const admin = await Admin.findOne({ email });

		if (!admin || !(await bcrypt.compare(password, admin.password)))
			return res.status(401).json({ message: "Invalid credentials" });

		if (!admin.isVerified)
			return res.status(403).json({ message: "Admin not verified" });

		// Update activeDateAndTime
		admin.activeDateAndTime = moment().format("YYYY-MM-DD HH:mm:ss");
		admin.activeDuration = moment().format("YYYY-MM-DD HH:mm:ss");
		admin.timeOfActive = moment().toDate();
		admin.lastLogin = moment().toDate();
		admin.status = "active";
		admin.date_updated = moment().format("YYYY-MM-DD HH:mm:ss");
		await admin.save();

		const { accessToken, refreshToken } = generateToken(
			admin._id,
			admin.email,
			admin.role
		);

		return res.status(200).json({
			success: true,
			accessToken: accessToken, // Return the new token
			refreshToken: refreshToken,
			admin,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Login failed" });
	}
};

const logoutAdmin = async (req, res, next) => {
	try {
		const userId = req.admin.id;
		const admin = await Admin.findById(userId);

		if (!admin) {
			console.log("No user", admin, userId);
			return next(new HttpError("User not found.", 404));
		}

		admin.status = "inactive";
		admin.timeOfInactive = moment().format("YYYY-MM-DD HH:mm:ss");
		await admin.save();

		res
			.status(200)
			.json({ success: true, message: `${admin.email} Logout successful` });
	} catch (err) {
		console.error("Error during admin logout:", err);
		next(new HttpError("Logout failed, please try again.", 500));
	}
};

// Forgot Password
const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		const admin = await Admin.findOne({ email });

		if (!admin) return res.status(404).json({ message: "Admin not found" });

		const resetToken = crypto.randomBytes(32).toString("hex");
		admin.resetPasswordToken = resetToken;
		admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
		await admin.save();

		await sendAdminPasswordResetEmail(email, resetToken);
		res.status(200).json({
			success: true,
			message: `Reset password instructions as been forwarded in to ${admin.email}`,
			resetToken,
		});
	} catch (error) {
		console.error("Forget password error message says :", error);
		res.status(500).json({
			message: "Failed to send password reset link, please try again.",
		});
	}
};

// Reset Password
const resetPassword = async (req, res, next) => {
	try {
		const { newPassword } = req.body;
		const token = req.params.token;

		const admin = await Admin.findOne({
			resetPasswordToken: token,
			resetPasswordExpires: { $gt: Date.now() },
		});

		if (!newPassword || typeof newPassword !== "string") {
			return next(
				new HttpError("New password is required and must be a string.", 400)
			);
		}

		if (!admin)
			return res.status(400).json({ message: "Invalid or expired token" });

		const hashed = await bcrypt.hash(newPassword, 10);
		admin.password = hashed;
		admin.resetPasswordToken = null;
		admin.resetPasswordExpires = null;
		await admin.save();

		res
			.status(200)
			.json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Password reset failed" });
	}
};

// Get Admin User
const fetchAdmin = async (req, res, next) => {
	try {
		const userId = req.admin.id; // middleware is actually using req.admin, for user it is req.user

		if (!userId) {
			return next(new HttpError("User ID not found", 400));
		}

		const admin = await Admin.findById(userId);

		if (!admin) {
			return next(new HttpError("admin not found", 404));
		}

		res.status(200).json({
			success: true,
			message: "admin retrieved successfully",
			data: { admin: admin },
		});
	} catch (err) {
		console.error("Error in getAdmin:", err);
		next(new HttpError("Failed to retrieve admin", 500));
	}
};

// CREATE a course
const createCourse = async (req, res) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(401).json({ message: "No token provided" });
	}
	const token = authHeader.split(" ")[1];
	try {
		const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);
		const admin = await Admin.findOne({ email: decoded.email });

		if (!admin) {
			return res.status(401).json({ message: "Invalid token!" });
		}

		const {
			title,
			price,
			summary,
			description,
			duration,
			level,
			instructor,
			modules,
			prerequisites,
			benefits,
			isMostPurchased,
			isHotCourse,
		} = req.body;

		if (
			!title ||
			!price ||
			!summary ||
			!description ||
			!duration ||
			!level ||
			!instructor ||
			!modules ||
			!prerequisites ||
			!req.files?.image
		) {
			return res
				.status(400)
				.json({ message: "All required fields must be provided." });
		}

		// Generate a unique folder using random number
		const folderId = Math.floor(100000 + Math.random() * 900000).toString();

		const uploadedImages = [];

		// Support single and multiple file uploads
		const imageFiles = Array.isArray(req.files.image)
			? req.files.image
			: [req.files.image];

		for (const file of imageFiles) {
			const result = await cloudinary.uploader.upload(file.tempFilePath, {
				folder: `course_image/${folderId}`,
				public_id: `${admin._id}_course_${Date.now()}`,
				resource_type: "auto",
			});

			uploadedImages.push({
				public_id: result.public_id,
				url: result.secure_url,
				type: result.resource_type,
			});
		}

		const subDepartment = {
			title,
			image: uploadedImages,
			price,
			summary,
			description,
			duration,
			level,
			instructor,
			modules: Array.isArray(modules) ? modules : [modules],
			prerequisites,
			benefits: Array.isArray(benefits) ? benefits : [],
			isMostPurchased: Boolean(isMostPurchased),
			isHotCourse: Boolean(isHotCourse),
		};

		const newCourse = new Course({
			subDepartment,
			createdBy: admin._id,
		});

		await newCourse.save();

		return res.status(201).json({
			success: true,
			message: "Course created successfully",
			course: newCourse,
		});
	} catch (error) {
		console.error("Create course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// GET all courses
const getAllCourses = async (req, res) => {
	try {
		const courses = await Course.find().sort({ createdAt: -1 });
		return res.status(200).json({ success: true, courses });
	} catch (error) {
		console.error("Fetch courses error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// UPDATE a course
const updateCourse = async (req, res) => {
	try {
		const { courseId } = req.params;

		const existingCourse = await Course.findById(courseId);
		if (!existingCourse) {
			return res.status(404).json({ message: "Course not found" });
		}

		const {
			title,
			price,
			summary,
			description,
			duration,
			level,
			instructor,
			modules,
			prerequisites,
			benefits,
			isMostPurchased,
			isHotCourse,
		} = req.body;

		// Handle image replacement if new images are provided
		let updatedImages = existingCourse.subDepartment.image;

		if (req.files?.image) {
			// Delete old images from Cloudinary
			for (const img of updatedImages) {
				await cloudinary.uploader.destroy(img.public_id);
			}

			// Upload new images
			const newImageFiles = Array.isArray(req.files.image)
				? req.files.image
				: [req.files.image];

			updatedImages = [];

			for (const file of newImageFiles) {
				const result = await cloudinary.uploader.upload(file.tempFilePath, {
					folder: `course_image/${courseId}`,
					public_id: `updated_${Date.now()}`,
					resource_type: "auto",
				});

				updatedImages.push({
					public_id: result.public_id,
					url: result.secure_url,
					type: result.resource_type,
				});
			}
		}

		// Update the course
		existingCourse.subDepartment = {
			title: title || existingCourse.subDepartment.title,
			image: updatedImages,
			price: price || existingCourse.subDepartment.price,
			summary: summary || existingCourse.subDepartment.summary,
			description: description || existingCourse.subDepartment.description,
			duration: duration || existingCourse.subDepartment.duration,
			level: level || existingCourse.subDepartment.level,
			instructor: instructor || existingCourse.subDepartment.instructor,
			modules: modules || existingCourse.subDepartment.modules,
			prerequisites:
				prerequisites || existingCourse.subDepartment.prerequisites,
			benefits: benefits || existingCourse.subDepartment.benefits,
			isMostPurchased:
				isMostPurchased ?? existingCourse.subDepartment.isMostPurchased,
			isHotCourse: isHotCourse ?? existingCourse.subDepartment.isHotCourse,
		};

		await existingCourse.save();

		return res.status(200).json({
			success: true,
			message: "Course updated successfully",
			course: existingCourse,
		});
	} catch (error) {
		console.error("Update course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// DELETE a course
const deleteCourse = async (req, res) => {
	try {
		const { courseId } = req.params;
		const course = await Course.findById(courseId);

		if (!course) return res.status(404).json({ message: "Course not found" });

		// ✅ Delete all associated images from Cloudinary
		const images = course.subDepartment.image;
		if (Array.isArray(images)) {
			for (const img of images) {
				await cloudinary.uploader.destroy(img.public_id);
			}
		}

		// ✅ Delete the course from MongoDB
		await Course.findByIdAndDelete(courseId);

		return res.status(200).json({
			success: true,
			message: "Course and images deleted successfully",
		});
	} catch (error) {
		console.error("Delete course error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// DELETE a user and all their related data
const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await User.findById(userId);

		if (!user) return res.status(404).json({ message: "User not found" });

		await User.findByIdAndDelete(userId);
		// If you store user-related records in other models, cascade-delete here too

		return res.status(200).json({
			success: true,
			message: "User and all associated data deleted.",
		});
	} catch (error) {
		console.error("Delete user error:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
};

// controllers/admin.js
const getAllUsers = async (req, res) => {
	try {
		const users = await User.find(); // You can add filters/limits
		res.status(200).json({
			success: true,
			message: "Users retrieved successfully",
			data: { users }, // 👈 return as `data.users`
		});
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ message: "Failed to retrieve users" });
	}
};

// sending admin id publicly for chat use (GET)
const getAdminPublicId = async (req, res, next) => {
	try {
		// Option 1: Find a specific admin designated as the public contact
		// Add a field like 'isPublicContact: true' to your Admin schema and query it.
		// Or find by a specific _id if you always want one fixed admin.
		const publicAdmin = await Admin.findOne(
			{ isPublicContact: true },
			"_id name email status"
		);

		if (publicAdmin) {
			return res.status(200).json({
				success: true,
				admin: {
					// Changed 'admins' to 'admin' to signify a single object
					id: publicAdmin._id,
					name: publicAdmin.name,
					email: publicAdmin.email,
					status: publicAdmin.status,
				},
			});
		}

		// Option 2 (Fallback if Option 1 not desired or if you just want any admin):
		// If no specific public admin, find the first available admin.
		const anyAdmin = await Admin.findOne({}, "_id name email status");

		if (anyAdmin) {
			return res.status(200).json({
				success: true,
				admin: {
					// Changed 'admins' to 'admin' to signify a single object
					id: anyAdmin._id,
					name: anyAdmin.name,
					email: anyAdmin.email,
					status: anyAdmin.status,
				},
			});
		}

		// If neither a designated public admin nor any other admin is found
		return res.status(404).json({
			success: false,
			message: "No public chat admin found in the database.",
		});
	} catch (err) {
		console.error("Error fetching public admin:", err);
		// Log the actual error for debugging, but send a generic message to the client
		next(
			new HttpError(
				"Failed to retrieve public admin details due to server error.",
				500
			)
		);
	}
};

module.exports = {
	registerAdmin,
	verifyOtp,
	resendOtp,
	loginAdmin,
	forgotPassword,
	resetPassword,
	fetchAdmin,
	logoutAdmin,
	// ================
	createCourse,
	getAllCourses,
	updateCourse,
	deleteCourse,
	deleteUser,
	getAllUsers,
	getAdminPublicId,
};
