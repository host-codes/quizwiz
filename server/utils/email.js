const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

exports.sendOTPEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Study Portal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3498db;">Study Portal Verification</h2>
                <p>Your OTP code is:</p>
                <h1 style="font-size: 2.5rem; color: #2ecc71;">${otp}</h1>
                <p>This code will expire in 15 minutes.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

exports.sendResetEmail = async (email, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset for Study Portal',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3498db;">Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this, please ignore this email.</p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};