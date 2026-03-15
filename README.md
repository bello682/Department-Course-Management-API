# Department & Course Management API

A robust backend system built with Node.js, Express, and Mongoose, featuring automated course enrollment, simulated payment processing, and real-time Admin-User chat via Socket.io.

_🚀 Features_

Dual-Role Authentication: Separate logic for Admins and Users using JWT.

Course Management: Full CRUD for Admins; public browsing for guests.

Simulated Payment: Unique transaction ID generation with automatic course enrollment upon "payment."

Real-time Chat: Persistent messaging system between Users and Admins using Socket.io and MongoDB.

Security: OTP verification, password hashing (BcryptJS), and protected middleware routes.

_🛠 Tech Stack_

Runtime: Node.js (Express)

Database: MongoDB (Mongoose ODM)

Real-time: Socket.io

Utilities: Moment.js (Dates), Cloudinary (Images), JWT (Auth)

# 📂 API Endpoints

_🔑 Authentication & Users_

1. User Routes (/api_url/users/task)

Method,Endpoint,Auth,Description
POST,/register,Public,Register new user
POST,/verifyUser-otp,User,Verify account via OTP
POST,/resendUser-otp,User,Request new OTP
POST,/login,Public,Authenticate user
POST,/logout,User,End session
POST,/forgot-password,Public,Trigger password reset email
POST,/reset-password/:token,Public,Set new password via token
GET,/getDepartments,User,Fetch user profile/applied courses
PUT,/updateDepartment,User,Update user information
DELETE,/deleteDepartment,User,Delete user account

_🛡 Admin Panel_ 2. Admin Routes (/api_url/users/task/admin)

Method,Endpoint,Auth,Description
POST,/register,Public,Admin registration
POST,/login,Public,Admin login
POST,/logout,Admin,Admin logout
POST,/verify-otp,Admin,Verify admin via OTP
GET,/getAdmin,Admin,Fetch admin profile
POST,/resend-otp,Admin,Resend admin OTP
POST,/forgot-password,Public,Admin password recovery
POST,/reset-password/:token,Public,Admin password reset
POST,/courses,Admin,Create a new course
GET,/courses,Admin,List all courses for admin
PUT,/courses/:courseId,Admin,Update course details
DELETE,/courses/:courseId,Admin,Delete a course
GET,/getDepartments-by-admin,Admin,Get all users in the system
DELETE,/user/:userId,Admin,Remove a specific user
GET,/public-admin-id,Public,Fetch admin ID for public reference

_💳 Payments & Enrollment_ 3. Payment & Enrollment (/api_url/users/task/user-payment)

Method,Endpoint,Auth,Description
POST,/apply-and-pay,User,Buy a course (Simulated Payment)
GET,/my-courses,User,Fetch user's purchased courses
GET,/my-receipts,User,Fetch user's transaction history
GET,/my-total,User,Get sum of all payments made

_Chat System_ 4. Chat System (/api_url/users/task/chat)

Method,Endpoint,Auth,Description
POST,/send,User,User sends message to Admin
POST,/send/admin,Admin,Admin sends message to User
GET,/history/:userId,User,Get chat history for user
GET,/admin/history/:userId,Admin,Admin views chat with specific user
GET,/user/unread-count,User,Check unread messages (User)
GET,/unread-count,Admin,Check unread messages (Admin)
GET,/users-with-last-message,Admin,List users with their latest message
GET,/admin/messages/all,Admin,View all system messages
DELETE,/:userIdToDeleteChatWith,Admin,Delete conversation with a user

# 💬 Real-time Chat (Socket.io)

The system uses a unified socket handler for real-time communication.

Connection URL: http://localhost:7075

Events:
Join: socket.emit("join", { userId, role }) - Joins a private room.

Send Message: socket.emit("sendMessage", { senderId, receiverId, text, role, clientId })

Receive Message: socket.on("receiveMessage", (data))

# ⚙️ Installation & Setup

1. Clone the repository: git clone <repo-url>
   cd department-subdepartment-endpoint

2. Install Dependencies: npm install

3. Environment Variables:
   Create a .env file in the root and add your MONGODB_URL, JWT_SECRET, and Cloudinary credentials as seen in the provided .env snippet.

4. Run the Server: npm run dev

# 🛑 Error Handling

_The API uses a centralized error middleware. All failed requests return a JSON object:_ {
"message": "Error message here",
"stack": "Stack trace (only in dev mode)"
}

# 🛠 Setup & Environment

_Configure .env:_

# .env.example

PORT=7075
MONGODB_URL=your_mongodb_connection_string
JSON_WEB_TOKEN_SECRET_KEY=your_secret_key
EMAIL_USER=example@gmail.com
EMAIL_PASS=your_app_password
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

# 🚀 Deployment & Email Configuration (Important)

Note for Recruiters/Testers: This application uses Nodemailer with Gmail SMTP for OTP verification and password resets.

Local Environment: Works out of the box (ensure you use an App Password from Google).

Render/Cloud Hosting: If you deploy this to Render, the email service may fail or timeout. This is because Render restricts outbound traffic on SMTP ports (465/587) to prevent spam.

To Test Email on Render: You would typically need to use a dedicated mail service like SendGrid, Mailgun, or Postmark.

Recommendation for Testing: For the best experience during evaluation, please test the email functionality in a local environment or check the console logs; I have included console.log statements to display the OTP in the terminal for easy debugging without requiring an active SMTP connection.

_🛠 Updated .env Example for Recruiters_
_Make sure they know they need an App Password, not just their regular password:_

# Email Configuration (Gmail)

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password # Not your regular Gmail password!
