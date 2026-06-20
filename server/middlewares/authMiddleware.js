import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const authenticateUser = async (req, res, next) => {
  console.log("Authenticating user...");
  try {
    const token = req.cookies.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const userId = decoded.userId || decoded.id;

    if (!userId) {
      return res.status(401).json({ message: "cannot authenticate user" });
    }
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "user not found" });
    }
    // ✅ Check if user is active
    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is blocked" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token expired or invalid, please login" });
  }
};

export const authorizeOrganizer = (req, res, next) => {
  console.log("authorize organizer")
  if (req.user?.role === "organizer" && req.user?.organizer.isVerified) return next();
  res.status(403).json({ message: "Access denied. Organizer is only allowed" });
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role === "admin") return next();
  res.status(403).json({ message: "Access denied. Admins is only allowed." });
};
