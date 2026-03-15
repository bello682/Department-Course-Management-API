const jwt = require("jsonwebtoken");

const generateReferenceNumber = () => {
	const randomDigits = (length) =>
		Array.from({ length }, () => Math.floor(Math.random() * 10)).join(""); // Generate random digits of specified length
	const randomLetters = (length) =>
		Array.from({ length }, () =>
			String.fromCharCode(65 + Math.floor(Math.random() * 26))
		).join(""); // Generate random letters of specified length

	// Construct the reference number
	return `RE${randomDigits(6)}${randomLetters(2)}${randomDigits(
		6
	)}${randomLetters(1)}`;
};

// Generate a 6-digit OTP
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a JSON Web Token
const generateToken = (user) => {
	const payload = {
		userId: user._id,
		email: user.email,
		role: user.role,
	};
	const accessToken = jwt.sign(payload, process.env.JSON_WEB_TOKEN_SECRET_KEY, {
		expiresIn: "1h",
	});
	const refreshToken = jwt.sign(
		payload,
		process.env.JSON_WEB_TOKEN_SECRET_KEY,
		{
			expiresIn: "7d",
		}
	);
	return { accessToken, refreshToken };
};

// const createTokens = (userId, email) => {
// 	const accessToken = jwt.sign(
// 		{ id: userId, email },
// 		process.env.JSON_WEB_TOKEN_SECRET_KEY,
// 		{ expiresIn: "20m" }
// 	);
// 	const refreshToken = jwt.sign(
// 		{ id: userId, email },
// 		process.env.JSON_WEB_TOKEN_SECRET_KEY,
// 		{ expiresIn: "7d" }
// 	);
// 	return { accessToken, refreshToken };
// };

// usage
// Generate tokens
// const { accessToken, refreshToken } = createTokens(
// 	newUser._id,
// 	newUser.email
// );

module.exports = { generateReferenceNumber, generateOTP, generateToken };
