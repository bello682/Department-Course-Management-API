const nodemailer = require("nodemailer");
// const logo = "../../../public/assets/logoWeb.png";

// Reusable function to send email messages
const sendEmailMessage = async (
	email,
	subject,
	referenceNumber,
	status,
	additionalMessage
) => {
	const transporter = nodemailer.createTransport({
		// service: "gmail",
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: subject,
		html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                        margin: 0;
                        padding: 20px;
                    }
                    .container {
                        background-color: #ffffff;
                        border-radius: 8px;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        padding: 20px;
                        max-width: 600px;
                        margin: auto;
                    }
                    h1 {
                        color: #333;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.5;
                        color: #555;
                    }
                    .status {
                        font-size: 20px;
                        font-weight: bold;
                        color: #4CAF50; /* Green color for accepted */
                    }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                        font-size: 14px;
                        color: #999;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        background-color: #4CAF50; /* Green button */
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                    }
                    .button:hover {
                        background-color: #45a049;
                    }
                    .referenceNumber {
                        font-size: 18px;
                        color: #4CAF50;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>${
											status === "accepted"
												? "Booking Accepted"
												: status === "rejected"
												? "Booking Rejected"
												: status === "deleted"
												? "Booking Deleted"
												: "Booking Completed"
										}</h1>
                    <p>Dear ${BookingRequest.name},</p>
                    <p>We wanted to inform you that your booking request has been <span class="status">${status}</span>.</p>
                    <p><strong>Reference Number:</strong> <strong class="referenceNumber">${referenceNumber}</strong></p>
                    <p>${additionalMessage}</p>
                    <p class="button">Thank you for choosing our services!</p>
                    <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                    </div>
                    </div>
                    </body>
                    </html>
                    `,
	};
	// <a href="#" class="button">View Your Booking</a>

	await transporter.sendMail(mailOptions);
};

// OTP code email

const sendUserOTPEmail = async (email, otp, fullName) => {
	try {
		const transporter = nodemailer.createTransport({
			// service: "gmail",
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "🔒 Your Verification Code - Secure Your Account",
			html: `
                <div style="
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 600px;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                ">
                    <div style="text-align: center;">
                        <h2 style="color: #4CAF50; margin-bottom: 10px;">Your Verification Code</h2>
                      <p style="font-size: 16px; color: #555;">
                            Welcome, <span style="font-size: 16px; color: #4CAF50; font-weight: bold;">${fullName}</span>. To complete your registration and ensure full access, please use the verification code below.
                      </p>
                        <div style="
                            background-color: #f4f4f4;
                            padding: 15px;
                            margin: 20px auto;
                            width: fit-content;
                            border-radius: 5px;
                            border: 1px dashed #4CAF50;
                            font-size: 24px;
                            font-weight: bold;
                            color: #333;
                            letter-spacing: 2px;
                        ">
                            ${otp}
                        </div>
                        <p style="font-size: 14px; color: #777;">
                            This code will expire in <strong style="color: #4CAF50;">20 minutes</strong>. 
                            If you didn’t request this code, you can safely ignore this email.
                        </p>
                        <div style="margin-top: 20px;">
                            <a href="https://your-platform.com/verify" style="
                                background-color: #4CAF50;
                                color: #ffffff;
                                padding: 12px 24px;
                                text-decoration: none;
                                border-radius: 5px;
                                display: inline-block;
                                font-size: 16px;
                                font-weight: bold;
                                transition: background-color 0.3s ease;
                            " onMouseOver="this.style.backgroundColor='#45a049'">
                                Verify Now 🚀
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #999; margin-top: 30px;">
                            Need help? Contact our <a href="mailto:support@your-platform.com" style="color: #4CAF50; text-decoration: none;">support team</a>.
                        </p>
                    </div>
                </div>
            `,
		};

		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("Error sending OTP email:", error);
		throw new Error("Failed to send OTP email.");
	}
};

// Welcoming Email message

const sendWelcomeEmailToUser = async (email, fullName) => {
	try {
		const transporter = nodemailer.createTransport({
			// service: "gmail",
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "🎉 Welcome to Our Platform!",
			html: `
                <div style="
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                ">
                    <h2 style="color: #4CAF50; text-align: center;">Welcome to Our Platform, ${fullName}!</h2>
                    <p style="font-size: 16px; color: #333;">
                        We're thrilled to have you onboard. 🎯 
                        Your account has been successfully created, and you're now part of an amazing community.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Get ready to explore all the exciting features we have to offer.
                        If you have any questions, feel free to reach out to our support team.
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="https://frontend-heavy-task.vercel.app/login" style="
                            background-color: #4CAF50;
                            color: #ffffff;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 5px;
                            display: inline-block;
                            font-size: 16px;
                            font-weight: bold;
                            transition: background-color 0.3s ease;
                        " onMouseOver="this.style.backgroundColor='#45a049'">
                            Get Started 🚀
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #777; text-align: center;">
                        If you didn’t create an account, you can safely ignore this email.
                    </p>
                    <p style="font-size: 14px; color: #777; text-align: center;">
                        Thank you for joining us! 💖
                    </p>
                </div>
            `,
		};

		await transporter.sendMail(mailOptions);
		// console.log("Welcome email sent successfully!");
	} catch (error) {
		console.error("Error in sendWelcomeEmail:", error);
		throw new Error("Failed to send welcome email.");
	}
};

// sending password reset emails to
const sendUserPasswordResetEmail = async (email, resetToken) => {
	const resetLink = `${process.env.WEBSITE_URL}/password-reset/${resetToken}`;

	const transporter = nodemailer.createTransport({
		// service: "gmail",
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Password Reset Request",
		html: `
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">RESET NOW</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
	};

	await transporter.sendMail(mailOptions);
};
// sending password reset emails to
const sendAdminPasswordResetEmail = async (email, resetToken) => {
	const resetLink = `${process.env.ADMIN_WEBSITE_URL}/admin-reset-password/${resetToken}`;

	const transporter = nodemailer.createTransport({
		// service: "gmail",
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: email,
		subject: "Password Reset Request",
		html: `
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">RESET NOW</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
	};

	await transporter.sendMail(mailOptions);
};

// sending login notification emails to Agent
const sendLoginNotificationEmail = async (
	email,
	{ fullName, loginTime, fraudAlertLink }
) => {
	try {
		const transporter = nodemailer.createTransport({
			// service: "gmail",
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: "🔐 Login Alert - Your Account Was Accessed",
			html: `
				<div style="
					font-family: Arial, sans-serif;
					line-height: 1.6;
					max-width: 600px;
					margin: 20px auto;
					padding: 20px;
					background-color: #f9f9f9;
					border: 1px solid #e0e0e0;
					border-radius: 8px;
					box-shadow: 0 4px 8px rgba(0,0,0,0.1);
				">
					<h2 style="color: #4CAF50;">Hi ${fullName},</h2>
					<p style="color: #333;">We noticed a new login to your account on:</p>
					<div style="padding: 10px; background-color: #e0f7fa; border-left: 4px solid #4CAF50; margin-bottom: 20px;">
						<strong>Date & Time:</strong> ${loginTime}<br>
						<strong>Email:</strong> ${email}
					</div>
					<p style="color: #333;">If this was <strong>you</strong>, no further action is required.</p>
					<p style="color: #d32f2f;"><strong>If you did not perform this login</strong>, it may be unauthorized. Please click the link below to report it immediately as a scam or fraud attempt:</p>
					<div style="text-align: center; margin: 30px 0;">
						<a href="${fraudAlertLink}" style="
							background-color: #d32f2f;
							color: #ffffff;
							padding: 12px 24px;
							text-decoration: none;
							border-radius: 5px;
							font-size: 16px;
							font-weight: bold;
							display: inline-block;
						">Report Scam/Fraud 🚨</a>
					</div>
					<p style="font-size: 14px; color: #999;">If you need help or believe your account is at risk, contact our <a href="mailto:support@your-platform.com" style="color: #4CAF50;">support team</a> immediately.</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
	} catch (error) {
		console.error("Error sending login notification email:", error);
		throw new Error("Failed to send login notification email.");
	}
};

module.exports = {
	sendEmailMessage,
	sendUserOTPEmail,
	sendWelcomeEmailToUser,
	sendUserPasswordResetEmail,
	sendAdminPasswordResetEmail,
	sendLoginNotificationEmail,
};
