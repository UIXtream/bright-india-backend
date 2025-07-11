const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    profilePic: String,
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    income: {
      trading: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      level: { type: Number, default: 0 },
      reward: { type: Number, default: 0 },
    },
    deposit: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
