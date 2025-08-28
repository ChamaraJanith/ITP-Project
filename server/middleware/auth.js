import { verifyAccessToken } from "../services/jwt.js";

export const requireAuth = (req, res, next) => {
  try {
    // Access token comes from httpOnly cookie
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { id, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
