const express = require("express");
const cors = require("cors");
const { connect } = require("mongoose");
require("dotenv").config();
const fileUpload = require("express-fileupload");

const http = require("http");
const socketIO = require("socket.io");

const userRoute = require("./routers/userRouter");
const adminRoute = require("./routers/adminRoute");
const userPaymentRoutes = require("./routers/userPaymentRoute");
const publicCourseRoutes = require("./routers/publicCourseRoute");
const chatRoutes = require("./routers/chatRoute");
const chatSocketHandler = require("./sockets/chatSocket");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const app = express();
const server = http.createServer(app); // 👈 Attach server
const io = socketIO(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://frontend-heavy-task.vercel.app",
    ],

    methods: ["GET", "POST"],
    credentials: true, // If your socket.io needs to send cookies/auth headers
  },
});

// ✅ Attach socket handlers
chatSocketHandler(io);

// 📦 Middleware
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "https://frontend-heavy-task.vercel.app",
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  }),
);

// Configure express-fileupload with temp files support
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/", // Temporary directory for file uploads
  }),
);

// 🔗 Routes
app.use("/api_url/users/task", userRoute);
app.use("/api_url/users/task/admin", adminRoute);
app.use("/api_url/users/task/user-payment", userPaymentRoutes);
app.use("/api_url/users/task/public-courses", publicCourseRoutes);
app.use("/api_url/users/task/chat", chatRoutes);

app.use(notFound);
app.use(errorHandler);

// 🚀 Connect DB and Start Server
const dataBaseConnection = async () => {
  try {
    await connect(process.env.MONGODB_URL);
    console.log("✅ Database connected");

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server + Socket.IO running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ DB connection error:", err);
  }
};

dataBaseConnection();
