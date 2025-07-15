import express from "express";
import User from "../models/User.js";
import PaymentProof from "../models/PaymentProof.js";
import Deposit from "../models/Deposit.js";
import verifyToken from "../utils/authMiddleware.js";

const router = express.Router();
// Admin profile route
// ✅ Fixed: Admin profile route
router.get("/me", verifyToken, async (req, res) => {
  try {
    // 🔍 Ab poora admin object fetch kar rahe hain
    const admin = await User.findById(req.user.id).select(
      "name profilePic role"
    );

    // ✅ Check admin role
    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.status(200).json({
      success: true,
      user: {
        name: admin.name,
        profilePic: admin.profilePic, // ✅ This will now show Cloudinary URL
      },
    });
  } catch (err) {
    console.error("Admin profile error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch admin profile" });
  }
});

// 📦 Admin Stats Route
router.get("/stats", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ deposit: { $gt: 0 } });
    const totalReferrals = await User.countDocuments({
      referredBy: { $ne: null },
    });

    const users = await User.find();
    let totalEarnings = 0;
    let tradingProfit = 0;
    let walletBalances = 0;

    users.forEach((user) => {
      totalEarnings += (user.income?.direct || 0) + (user.income?.level || 0);
      tradingProfit += user.income?.trading || 0;
      walletBalances += user.deposit || 0;
    });

    res.json({
      totalUsers,
      activeUsers,
      totalReferrals,
      totalEarnings,
      tradingProfit,
      walletBalances,
      pendingWithdrawals: 0, // change if implemented
      supportTickets: 0, // change if implemented
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Failed to load dashboard stats" });
  }
});

// 📦 Admin User List
router.get("/users", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const users = await User.find().select(
      "name email createdAt role referredBy"
    );
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Failed to load users" });
  }
});

// GET: User Details
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching user details." });
  }
});

// GET: All Payment Proofs
router.get("/paymentproofs", async (req, res) => {
  try {
    const proofs = await PaymentProof.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, proofs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching proofs." });
  }
});

// POST: Approve Payment Proof
router.post("/approve-proof/:id", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const proof = await PaymentProof.findById(req.params.id).populate("userId");
    if (!proof) {
      return res
        .status(404)
        .json({ success: false, message: "Proof not found" });
    }

    if (proof.status === "Approved") {
      return res
        .status(400)
        .json({ success: false, message: "Already approved" });
    }

    // ✅ Update proof status
    proof.status = "Approved";
    await proof.save();

    // ✅ Update user's deposit
    const user = await User.findById(proof.userId._id);
    user.deposit += Number(proof.amount);
    await user.save();

    // ✅ Optional: Save deposit record
    await Deposit.create({
      userId: user._id,
      amount: proof.amount,
      status: "Approved",
    });

    res.json({ success: true, message: "Proof approved and deposit updated" });
  } catch (err) {
    console.error("Approve Proof Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/admin/changerole/:userId
router.put("/changerole/:userId", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (currentUser.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { newRole } = req.body;

    if (!["admin", "user"].includes(newRole)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.userId,
      { role: newRole },
      { new: true }
    );

    res.json({
      success: true,
      message: `Role updated to ${newRole}`,
      user: {
        name: updated.name,
        email: updated.email,
        role: updated.role,
      },
    });
  } catch (err) {
    console.error("Role change failed", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// for payment proof screenshot rejection
// POST /reject-proof/:id
router.post("/reject-proof/:id", verifyToken, async (req, res) => {
  try {
    const proofId = req.params.id;

    const proof = await PaymentProof.findById(proofId).populate("userId");

    if (!proof)
      return res
        .status(404)
        .json({ success: false, message: "Proof not found" });

    proof.status = "Rejected";
    await proof.save();

    // ✅ Optional: Add message to user
    if (proof.userId) {
      proof.userId.notifications = proof.userId.notifications || [];
      proof.userId.notifications.push({
        message:
          "Your payment was rejected. Reason: Fake or invalid screenshot.",
        date: new Date(),
      });
      await proof.userId.save();
    }

    res.json({ success: true, message: "Proof rejected successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
