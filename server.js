const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

app.use(cors({
  origin: "*", // Or restrict to just your frontend: "https://cryptocurrency.makemysports.in"
  methods: ["POST", "GET"],
}));


app.use(helmet());

// For parsing JSON requests
app.use(express.json());

// Static file serving for profile images
app.use("/uploads", express.static("uploads"));

// ✅ Add root route for health check
app.get("/", (req, res) => {
  res.send("✅ Bright India API is running");
});

// Auth Routes
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("✅ MongoDB connected");

  // ✅ Use dynamic port for Render
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

})
.catch(err => {
  console.error("❌ MongoDB connection error:", err);
});
