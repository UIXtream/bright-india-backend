const mongoose = require("mongoose");

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

  // ✅ Add this notifications array
  notifications: [
    {
      message: { type: String },
      date: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
