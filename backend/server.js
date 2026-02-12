require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// CRC16 FUNCTION (VERY IMPORTANT)
// ===============================
function crc16ccitt(str) {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

// ===============================
// GENERATE REAL KHQR STRING
// ===============================
function generateKHQR(amount) {
  const merchant = process.env.MERCHANT_ID;
  const store = process.env.STORE_NAME;

  const amountStr = amount.toFixed(2);

  let payload =
    "000201" +                  // Payload Format
    "010212" +                  // Dynamic QR
    "2937" +                    // Merchant Account Info
    "0016A000000677010111" +    // Bakong ID
    "01" + merchant.length.toString().padStart(2, "0") + merchant +
    "52045999" +                // Merchant Category
    "5303840" +                 // Currency USD
    "54" + amountStr.length.toString().padStart(2, "0") + amountStr +
    "5802KH" +                  // Country
    "59" + store.length.toString().padStart(2, "0") + store +
    "6007PHNOMPE" +             // City
    "6304";

  const crc = crc16ccitt(payload);

  return payload + crc;
}

// ===============================
// HEALTH CHECK
// ===============================
app.get("/", (req, res) => {
  res.send("🚀 Real KHQR Generator Running");
});

// ===============================
// POST /api/pay
// ===============================
app.post("/api/pay", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      error: "Amount must be greater than 0"
    });
  }

  const qrString = generateKHQR(Number(amount));

  res.json({
    success: true,
    amount: Number(amount),
    qrString
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
