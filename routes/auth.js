const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");
const verifyToken = require("../utils/authMiddleware");

const router = express.Router();

// ✅ Multer Setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = "uploads/profilePics";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = "profile-" + Date.now() + ext;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Signup Route (with file upload)
router.post("/signup", upload.single("profilePic"), async (req, res) => {
  console.log("🟢 Received Role:", req.body.role);
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const role = "user";
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicPath = req.file ? req.file.filename : "";

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: profilePicPath,
      role, // ✅ will always be "user" by default, or "admin" if provided
    });

    await user.save();

    console.log("✅ User saved to DB:", user);

    res.status(201).json({ success: true, message: "Signup successful." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// ✅ Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
   res.status(200).json({ message: "Login successful.", token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Forgot Password Route (dummy)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Email not found." });

  res
    .status(200)
    .json({ message: "Password reset instructions sent to your email." });
});

// ✅ Authenticated User Data (Profile Info)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Test Route
router.get("/test", (req, res) => {
  res.send("API is working!");
});

module.exports = router; // ✅ Now this is at the very end



// ✅ Middleware to check admin
const checkAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admin only." });
  }
  next();
};

// ✅ Get all users (admin only)
router.get("/admin/users", verifyToken, checkAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ Promote a user to admin (test/dev only)
router.post("/make-admin", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User promoted to admin.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

