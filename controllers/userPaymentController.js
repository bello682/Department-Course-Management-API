const User = require("../models/userModel");
const Course = require("../models/courses");
// const { v4: uuidv4 } = require("uuid");

const randomDigits = (length) =>
	Array.from({ length }, () => Math.floor(Math.random() * 10)).join(""); // Generate random digits of specified length

const randomLetters = (length) =>
	Array.from({ length }, () =>
		String.fromCharCode(65 + Math.floor(Math.random() * 26))
	).join(""); // Generate random letters of specified length

const generateUniqueReferenceNumber = async () => {
	let transactionId;
	let isUnique = false;
	let retryCount = 0;
	const MAX_RETRIES = 5;

	while (!isUnique && retryCount < MAX_RETRIES) {
		transactionId = `TX-${randomDigits(6)}${randomLetters(2)}${randomDigits(
			6
		)}${randomLetters(1)}`;

		// Check if the reference number already exists in the database
		const existingBooking = await User.findOne({
			"receipts.transactionId": transactionId,
		});
		if (!existingBooking) {
			isUnique = true;
		} else {
			retryCount++;
		}
	}

	if (!isUnique) {
		throw new Error(
			"Failed to generate a unique transaction Id number after multiple attempts."
		);
	}

	return transactionId;
};

// 1. Apply for a course (includes simulated payment)
const applyAndPayForCourse = async (req, res, next) => {
	try {
		const userId = req.user._id;
		const { courseId, methodOfPayment } = req.body;

		const course = await Course.findById(courseId);
		if (!course) return next(new HttpError("Course not found", 404));

		const user = await User.findById(userId);
		if (!user) return next(new HttpError("User not found", 404));

		// Check if already purchased
		const alreadyApplied = user.subDepartments.some(
			(sub) => sub.title === course.subDepartment.title
		);
		if (alreadyApplied) {
			return res.status(409).json({ message: "Course already purchased." });
		}

		// 2. Simulate payment (mock Paystack/Flutterwave)
		const transactionId = await generateUniqueReferenceNumber();
		const paymentAmount = course.subDepartment.price;

		// 3. Save receipt
		user.receipts.push({
			email: user.email,
			transactionId,
			courseTitle: course.subDepartment.title,
			amountPaid: paymentAmount,
			methodOfPayment,
		});

		// 4. Add course to subDepartments
		user.subDepartments.push(course.subDepartment);
		user.totalAmountPaid += paymentAmount;

		await user.save();

		res.status(200).json({
			message: "Payment successful & course applied",
			transactionId,
			courseTitle: course.subDepartment.title,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Something went wrong" });
	}
};

// Get all purchased courses
const getMyCourses = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		res.status(200).json({ courses: user.subDepartments });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Failed to fetch courses" });
	}
};

// Get all receipts
const getMyReceipts = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		res.status(200).json({ receipts: user.receipts });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Failed to fetch receipts" });
	}
};

// Get total amount paid
const getTotalAmountPaid = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		res.status(200).json({ total: user.totalAmountPaid });
	} catch (error) {
		console.error(error);
		res.status(500).json({ message: "Failed to fetch total amount paid" });
	}
};

module.exports = {
	applyAndPayForCourse,
	getMyCourses,
	getMyReceipts,
	getTotalAmountPaid,
};
