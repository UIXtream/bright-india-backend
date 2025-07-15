// models/Deposit.js
import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: "Approved" },
  createdAt: { type: Date, default: Date.now }
});

const Deposit = mongoose.model("Deposit", depositSchema);
export default Deposit;
