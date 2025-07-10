import express from 'express';
import dotenv from "dotenv";
import { connectDB } from '../config/db.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import productRoutes from '../routes/product.route.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json()); // Middleware to parse JSON bodies

app.use('/api/Product',productRoutes);


app.listen(PORT, () => {
    connectDB();
    console.log("Server started at http://localhost:"+PORT);
});
