const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors({
  origin: ["https://your-frontend-url.com", "http://localhost:5500"], // ✅ add deployed frontend URL here
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));
app.use(helmet());
app.use(express.json());

// ✅ Serve images
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ Use __dirname for Render

// Health check
app.get("/", (req, res) => {
  res.send("✅ Bright India API is running on Render!");
});

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

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
