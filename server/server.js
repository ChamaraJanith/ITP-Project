import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js"; // Add ".js" for ES Module import

// initiate express app
const app = express();
const PORT = process.env.PORT || 7000;

// Call the connectDB function to actually initiate the MongoDB connection
connectDB();

// Middleware to parse incoming JSON requests and cookies, making data available as req.body
app.use(express.json());

// Parses cookies attached to incoming requests, making cookies available under req.cookies
app.use(cookieParser());

// Enable CORS and allows credentials to be included in requests
app.use(cors({ credentials: true }));

// Define routes
app.get("/", (req, res) => {
    res.send("Welcome to the server Hi hello!");
});

// Start the server on specific port
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
