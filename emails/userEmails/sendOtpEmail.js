// const nodemailer = require("nodemailer");

// // Send OTP via email
// const sendOTPEmail = async (email, otp) => {
// 	const transporter = nodemailer.createTransport({
// 		service: "gmail",
// 		auth: {
// 			user: process.env.EMAIL_USER,
// 			pass: process.env.EMAIL_PASS,
// 		},
// 	});

// 	const mailOptions = {
// 		from: process.env.EMAIL_USER,
// 		to: email,
// 		subject: "Your Verification OTP",
// 		text: `Your OTP for account verification is ${otp}. Expires in 20 minutes.`,
// 	};

// 	await transporter.sendMail(mailOptions);
// };

// module.exports = sendOTPEmail;

const nodemailer = require("nodemailer");

const sendOTPEmail = async (email, otp, name) => {
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
                        Hello <span style="font-size: 16px; color: #4CAF50; font-weight: bold;">${name}</span>! We're excited to have you. Just one more step to secure your account: please enter the verification code provided below.
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
};

module.exports = sendOTPEmail;
