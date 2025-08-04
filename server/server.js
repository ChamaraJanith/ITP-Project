import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import 'dotenv/config';
import userRouter from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 7000;

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("Welcome to the server Hi hello!");
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
