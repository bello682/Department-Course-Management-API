const jwt = require("jsonwebtoken");
// const generateToken = (user) => {
// 	const payload = {
// 		userId: user._id,
// 		email: user.email,
// 		role: user.role,
// 	};
// 	return jwt.sign(payload, process.env.JSON_WEB_TOKEN_SECRET_KEY, {
// 		expiresIn: "20h",
// 	});
// };

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

module.exports = { generateToken };
