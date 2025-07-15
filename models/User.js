import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  profilePic: String,
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  deposit: { type: Number, default: 0 },
  income: {
    direct: { type: Number, default: 0 },
    level: { type: Number, default: 0 },
    trading: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  notifications: [
    {
      message: String,
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
