import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import chatbotRouter from "./routes/chatbot.js";
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 7000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true,
}));

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to the server Hi hello!");
});

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/chatbot', chatbotRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Chatbot endpoint: http://localhost:${PORT}/api/chatbot`);
});
