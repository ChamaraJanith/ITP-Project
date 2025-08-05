import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './database/db.js';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
    connectDB().catch((error) => {
        console.error("Failed to connect to the database:", error.message);
        process.exit(1); // Exit process with failure
    });

});

export default app;
