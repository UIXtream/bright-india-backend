import helmet from "helmet";
import path from "path";
import cron from "node-cron";
import axios from "axios";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js"; // ✅ Import only once

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "https://brightindia.co"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// Static uploads
app.use("/uploads", express.static(path.join(path.resolve(), "uploads"))); // ✅ Fixed __dirname for ES module

// Health check
app.get("/", (req, res) => {
  res.send("✅ Bright India API is running on Render!");
});

app.get("/ping", (req, res) => {
  res.send("OK");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // ✅ Use imported route

// 🔁 Cron job for daily income
cron.schedule("0 0 * * *", async () => {
  try {
    const res = await axios.post("http://localhost:5000/api/auth/distribute-daily-income");
    console.log("✅ Cron Job: Daily Trading Income Distributed -", res.data.message);
  } catch (err) {
    console.error("❌ Cron Job Error:", err.message);
  }
});

// MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("✅ MongoDB connected");

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("❌ MongoDB connection failed:", err);
});
