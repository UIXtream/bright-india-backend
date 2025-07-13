const jwt = require("jsonwebtoken");
const User = require("../models/User"); // ✅ Needed for role check from DB

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔍 Fetch user from DB to get the latest role
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    req.user = {
      id: user._id,
      role: user.role, // ✅ Attach accurate role
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "Token is invalid or expired" });
  }
};

module.exports = verifyToken;
