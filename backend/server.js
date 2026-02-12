require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const paymentRoutes = require("./routes/payment");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", paymentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("MongoDB Error:", err));

// Health Check
app.get("/", (req, res) => {
  res.send("Bakong KHQR Backend Running 🚀");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
