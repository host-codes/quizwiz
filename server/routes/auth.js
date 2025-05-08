const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../utils/email');

// Signup
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        // Create new user
        user = new User({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            isVerified: false
        });
        
        await user.save();
        
        // Send OTP email
        await sendOTPEmail(email, otp);
        
        res.status(201).json({ message: 'OTP sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        // Check OTP
      /*  if (user.otp !== parseInt(otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }*/

// After (fixed)
if (user.otp !== parseInt(otp)) {
  return res.status(400).json({ message: 'Invalid OTP' });
}
        
        // Check OTP expiry
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'OTP expired' });
        }
        
        // Mark as verified
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Check if verified
        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email first' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({ 
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change Password
router.post('/change-password', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        // Generate reset token
        const resetToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Save reset token
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await user.save();
        
        // Send reset email
        await sendResetEmail(email, resetToken);
        
        res.json({ message: 'Reset link sent to email' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findOne({ 
            _id: decoded.userId,
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password and clear reset token
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();
        
        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
