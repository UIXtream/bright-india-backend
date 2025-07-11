// models/Deposit.js
const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Approved" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Deposit", depositSchema);