import jwt from "jsonwebtoken";
import UserModel from "../model/userModel.js"; // Optional, for deeper checks

const userAuth = async (req, res, next) => {
  // Try to get token from cookies or Authorization header
  const token =
    req.cookies.token ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not Authorized. Login again.' });
  }
  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    // Assign user details to req.user for downstream usage
    req.user = { id: tokenDecode.id };

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export default userAuth;
