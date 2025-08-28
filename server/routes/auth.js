import express from "express";
import User from "../model/User.js";
import { registerUser, loginUser, refresh, me, logout } from "../controller/authController.js";
import { requireAuth } from "../middleware/auth.js";

const authRouter = express.Router(); // ✅ renamed router to authRouter

// POST /api/auth/register
authRouter.post("/register", registerUser);

// POST /api/auth/login
authRouter.post("/login", loginUser);

//52

router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/logout", logout);


// Get user by ID
authRouter.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
authRouter.put("/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone },
      { new: true }
    ).select("-password");
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default authRouter; // ✅ now matches variable name
