import express from "express";
import cors from "cors";
import mongoose from "mongoose";    
import 'dotenv/config';
import cookieParser from "cookie-parser";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());
app.use(cookieParser)
