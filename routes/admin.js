const express = require("express");
const router = express.Router();
const User = require("../models/User");
const PaymentProof = require("../models/PaymentProof");
const Deposit = require("../models/Deposit");

// GET: Admin Stats
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReferrals = await User.countDocuments({ referredBy: { $ne: null } });
    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalDepositAmount = totalDeposits[0]?.total || 0;
    const pendingProofs = await PaymentProof.countDocuments({ status: "Pending" });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalReferrals,
        totalDepositAmount,
        pendingProofs
      }
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to load stats." });
  }
});

// GET: All Users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching users." });
  }
});

// GET: User Details
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching user details." });
  }
});

// GET: All Payment Proofs
router.get("/paymentproofs", async (req, res) => {
  try {
    const proofs = await PaymentProof.find().populate("userId", "name email").sort({ createdAt: -1 });
    res.json({ success: true, proofs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching proofs." });
  }
});

// POST: Approve Payment Proof
router.post("/approve-proof/:id", async (req, res) => {
  try {
    const proof = await PaymentProof.findById(req.params.id);
    if (!proof) return res.status(404).json({ success: false, message: "Proof not found" });

    proof.status = "Approved";
    await proof.save();

    // Add deposit record
    await Deposit.create({
      userId: proof.userId,
      amount: proof.amount,
      status: "Approved"
    });

    // Update user deposit
    const user = await User.findById(proof.userId);
    user.deposit += proof.amount;
    await user.save();

    res.json({ success: true, message: "Proof approved and deposit recorded." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve." });
  }
});

module.exports = router;
