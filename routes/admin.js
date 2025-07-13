const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PaymentProof = require("../models/PaymentProof");
const Deposit = require("../models/Deposit");
const verifyToken = require("../utils/authMiddleware");


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
    return res.status(403).json({ message: "Access denied" });
  }
  try {
    const proof = await PaymentProof.findById(req.params.id);
    if (!proof)
      return res
        .status(404)
        .json({ success: false, message: "Proof not found" });

    proof.status = "Approved";
    await proof.save();

    // Add deposit record
    await Deposit.create({
      userId: proof.userId,
      amount: proof.amount,
      status: "Approved",
    });

    // Update user deposit
    const user = await User.findById(proof.userId);
    user.deposit += proof.amount;
    await user.save();

    res.json({
      success: true,
      message: "Proof approved and deposit recorded.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve." });
  }
});

module.exports = router;
