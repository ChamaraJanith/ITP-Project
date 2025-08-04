import UserModel from "../model/userModel.js";


import UserModel from "../model/userModel.js";

export const getUserData = async (req, res) => {
  try {
    // Use user ID from middleware (req.user.id)
    const userID = req.user.id;

    const user = await UserModel.findById(userID);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      userData: {
        name: user.name,
        isAccountVerified: user.isAccountVerified,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
