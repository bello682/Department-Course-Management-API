const jwt = require("jsonwebtoken");
const HttpError = require("../models/errorModel");
const Users = require("../models/userModel");

const userAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpError("Unauthorized. No token provided.", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
    );

    if (decodedToken.role !== "user") {
      return next(new HttpError("Access forbidden: user only.", 403));
    }

    if (!decodedToken.userId) {
      return next(new HttpError("User ID not found in token.", 401));
    }

    // req.user = { id: decodedToken.userId, email: Users.email, role: "user" };
    req.user = {
      id: decodedToken.userId,
      email: decodedToken.email,
      role: "user",
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("TokenExpiredError:", error);
      return next(new HttpError("Token expired. Please log in again.", 401));
    } else {
      return next(new HttpError("Invalid token. Please log in again.", 401));
    }
  }
};

module.exports = userAuthMiddleware;
