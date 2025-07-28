import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js";
import 'dotenv/config';
import transporter from "../config/nodemailer.js"; // Import nodemailer transporter

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Please fill all the fields" });
    }
    
    try {
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new UserModel({ name, email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Fixed cookie configuration for development
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Changed from 'strict' to 'lax'
            maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            path: '/' // Explicitly set path
        });

        // Import nodemailer transporter to welcome email
        const mailOptioins = {
        from: process.env.SENDER_EMAIL,
        to: email,
        subject: "Welcome to Our Service",
        text: `Hello ${name},\n\nThank you for registering with us! We're excited to have you on board.\n\nBest regards,\nYour Team`
        }
        
        await transporter.sendMail(mailOptioins);

        // FIXED: Added proper JSON response after setting cookie
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error in register:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    try {
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // Fixed cookie configuration
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error in login:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            path: '/' // Important: path must match the original cookie
        });
        
        return res.status(200).json({ success: true, message: "Logout successful" });
    } catch (error) {
        console.error("Error in logout:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
