const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");
const verifyToken = require("../utils/authMiddleware");

const router = express.Router();

// ✅ Multer setup for saving files to /uploads/profilePics
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

// ✅ Signup
// backend/routes/auth.js
router.post("/signup", upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicName = req.file ? req.file.filename : "";

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: profilePicName,
      referredBy: referredBy || null
    });

    await user.save();

    res.status(201).json({ success: true, message: "Signup successful." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// my team
router.get("/team", verifyToken, async (req, res) => {
  try {
    const team = await User.find({ referredBy: req.user.id }).select("name email createdAt");
    res.status(200).json({ team });
  } catch (err) {
    res.status(500).json({ message: "Failed to load team members" });
  }
});

// ✅ Login
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
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      profilePic: user.profilePic,
      name: user.name
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Profile route
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
  res.send("✅ Auth API working");
});

module.exports = router;
