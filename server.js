const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const cron = require("node-cron");
const axios = require("axios");

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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.send("✅ Bright India API is running on Render!");
});

app.get("/ping", (req, res) => {
  res.send("OK");
});

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
const adminRoutes = require("./routes/admin"); 
app.use("/api/admin", adminRoutes); 

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
