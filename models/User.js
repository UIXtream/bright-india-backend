const mongoose = require("mongoose");

// Example: separate schema and model for new users
const newUserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  profilePic: String
});

const NewUser = mongoose.model("NewUser", newUserSchema, "newusers");

