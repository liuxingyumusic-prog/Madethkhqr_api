require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// In-memory storage (NO DATABASE)
let payments = {};

// Health Check
app.get("/", (req, res) => {
  res.send("🚀 Bakong KHQR Simple Backend Running");
});

// ===============================
// POST /api/pay
// ===============================
app.post("/api/pay", async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: "Amount is required" });
  }

  const orderId = "MADETH-" + Date.now();

  try {
    const response = await axios.post(
      "https://api-bakong.nbc.gov.kh/v1/generate_deeplink_by_qr",
      {
        merchantId: process.env.MERCHANT_ID,
        amount: amount,
        currency: "USD",
        storeName: "MADETH STORE",
        terminalId: "Web_Portal",
        externalId: orderId
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const qrString = response.data.qrCode;

    // Save in memory
    payments[orderId] = {
      orderId,
      amount,
      status: "PENDING",
      createdAt: Date.now()
    };

    res.json({
      orderId,
      amount,
      qrString
    });

  } catch (error) {
    console.error("Bakong API Error:", error.response?.data || error.message);

    // Fallback QR (for testing)
    const fallbackQR = `00020101021226520003ABA00010103${process.env.MERCHANT_ID}...`;

    payments[orderId] = {
      orderId,
      amount,
      status: "PENDING",
      createdAt: Date.now()
    };

    res.json({
      orderId,
      amount,
      qrString: fallbackQR
    });
  }
});


// ===============================
// GET /api/status/:orderId
// ===============================
app.get("/api/status/:orderId", (req, res) => {
  const { orderId } = req.params;

  const payment = payments[orderId];

  if (!payment) {
    return res.status(404).json({ error: "Order not found" });
  }

  // Simulate success after 30 seconds
  if (
    Date.now() - payment.createdAt > 30000 &&
    payment.status === "PENDING"
  ) {
    payment.status = "SUCCESS";
  }

  res.json({
    status: payment.status
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
