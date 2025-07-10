const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const User = require("../models/User");
const verifyToken = require("../utils/authMiddleware");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const router = express.Router();



// // ✅ Multer setup for saving files to /uploads/profilePics
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = "uploads/profilePics";
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const ext = path.extname(file.originalname);
//     const uniqueName = "profile-" + Date.now() + ext;
//     cb(null, uniqueName);
//   },
// });
// const upload = multer({ storage });

// 🔐 Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 📦 Use Cloudinary storage with Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "brightindia_profiles",   // optional: folder name in cloudinary
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }]
  }
});
const upload = multer({ storage });

// ✅ Signup
router.post("/signup", upload.single("profilePic"), async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const profilePicUrl = req.file ? req.file.path : ""; // ✅ Cloudinary gives full URL

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profilePic: profilePicUrl, // ✅ Save full URL
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
// for take referel name and id 
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name _id");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// GET /api/auth/referrals/:referrerId
router.get("/referrals/:referrerId", async (req, res) => {
  const { referrerId } = req.params;
  try {
    const users = await User.find({ referredBy: referrerId });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});


// GET /api/auth/level-income
router.get("/level-income", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const levels = [];
    let currentLevelUsers = [userId];
    const levelPercentages = {
      1: 1,
      2: 1,
      3: 0.5,
      4: 0.5,
      5: 0.25
    };

    for (let level = 1; level <= 5; level++) {
      const users = await User.find({ referredBy: { $in: currentLevelUsers } }).select("name email referredBy");
      const populatedUsers = await User.populate(users, { path: "referredBy", select: "name" });

      const levelData = populatedUsers.map(user => ({
        level,
        name: user.name,
        referredBy: user.referredBy ? user.referredBy.name : "N/A",
        percentage: levelPercentages[level],
        earnedFrom: Math.floor(Math.random() * 9000) + 1000 // You can replace this with real transaction logic
      }));

      levels.push(...levelData);

      // Prepare for next level
      currentLevelUsers = users.map(u => u._id);
    }

    res.json({ success: true, data: levels });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error while calculating level income" });
  }
});

// POST /api/auth/fake-income
router.post("/fake-income", verifyToken, async (req, res) => {
  try {
    const { userId, income } = req.body;

    if (!userId || !income) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    await User.findByIdAndUpdate(userId, {
      $set: {
        income
      }
    });

    res.json({ success: true, message: "Fake income added successfully" });
  } catch (err) {
    console.error("Fake income error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
