const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/auth"); // Your current file

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// For parsing JSON requests
app.use(express.json());

// Serve uploaded profile images statically
app.use("/uploads", express.static("uploads"));

// Auth Routes
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected");
  app.listen(5000, () => console.log("🚀 Server running at http://localhost:5000"));
})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
});
