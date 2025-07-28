import express from "express";
import cors from "cors";
import mongoose from "mongoose";    
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));
app.get("/", (req, res) => {
  res.send("Welcome to the ITP Project Server!");
}   );  
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
export default app;