require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* ==============================
   CRC16-CCITT (EMV REQUIRED)
============================== */
function crc16(payload) {
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
  }

  return (crc & 0xFFFF)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
}

/* ==============================
   FORMAT EMV FIELD
============================== */
function formatField(id, value) {
  return id + value.length.toString().padStart(2, "0") + value;
}

/* ==============================
   GENERATE REAL KHQR
============================== */
function generateKHQR(amount) {
  const merchantId = process.env.MERCHANT_ID;
  const storeName = process.env.STORE_NAME || "MADETH STORE";
  const city = process.env.CITY || "PHNOM PENH";

  const amountStr = Number(amount).toFixed(2);

  // ----- Merchant Account Info (Tag 29) -----
  const bakongAccountInfo =
    formatField("00", "A000000677010111") +
    formatField("01", merchantId);

  const merchantAccountField = formatField("29", bakongAccountInfo);

  // ----- Build Payload -----
  let payload =
    formatField("00", "01") +        // Payload Format Indicator
    formatField("01", "12") +        // Dynamic QR
    merchantAccountField +
    formatField("52", "5999") +      // Merchant Category Code
    formatField("53", "840") +       // Currency (840 = USD, 116 = KHR)
    formatField("54", amountStr) +   // Transaction Amount
    formatField("58", "KH") +        // Country Code
    formatField("59", storeName) +   // Merchant Name
    formatField("60", city) +        // Merchant City
    "6304";                          // CRC placeholder

  const crc = crc16(payload);

  return payload + crc;
}

/* ==============================
   ROUTES
============================== */

app.get("/", (req, res) => {
  res.send("🚀 100% Working KHQR Backend Running");
});

app.post("/api/pay", (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    const qrString = generateKHQR(amount);

    res.json({
      success: true,
      amount: Number(amount),
      qrString: qrString
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/* ==============================
   START SERVER
============================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🔥 KHQR Server running on port ${PORT}`);
});
