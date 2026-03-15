const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");
const HttpError = require("../models/errorModel");

const adminAuthMiddleware = async (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		if (!token) return next(new HttpError("No token, access denied", 401));

		const decoded = jwt.verify(token, process.env.JSON_WEB_TOKEN_SECRET_KEY);

		const admin = await Admin.findById(decoded.userId); // ✅ Use userId instead of id
		if (!admin)
			return next(new HttpError("Invalid token or admin not found", 401));

		req.admin = {
			id: admin._id,
			email: decoded.email,
			role: decoded.role,
		};

		next();
	} catch (error) {
		console.error("Admin protect error:", error);
		return next(new HttpError("Token verification failed", 401));
	}
};

module.exports = adminAuthMiddleware;
