// models/PaymentProof.js
import mongoose from "mongoose";

const paymentProofSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  screenshotUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const PaymentProof = mongoose.model("PaymentProof", paymentProofSchema);
export default PaymentProof;
