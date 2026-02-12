require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   EMV FIELD FORMATTER
========================= */
function field(id, value) {
  const length = value.length.toString().padStart(2, "0");
  return id + length + value;
}

/* =========================
   CRC16-CCITT (EMV)
========================= */
function crc16(payload) {
  let crc = 0xffff;

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

  crc &= 0xffff;
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/* =========================
   GENERATE KHQR
========================= */
function generateKHQR(amount) {
  const merchantId = process.env.MERCHANT_ID.trim();
  const storeName = process.env.STORE_NAME.trim();
  const city = process.env.CITY.trim();
  const currency = process.env.CURRENCY; // 840 USD / 116 KHR

  const amountStr = Number(amount).toFixed(2);

  // Merchant Account Information (Tag 29 for Bakong)
  const gui = field("00", "A000000677010111");
  const merchant = field("01", merchantId);

  const merchantAccountInfo = gui + merchant;

  const tag29 =
    "29" +
    merchantAccountInfo.length.toString().padStart(2, "0") +
    merchantAccountInfo;

  // Build Payload
  let payload =
    field("00", "01") +        // Payload format
    field("01", "11") +        // STATIC QR (more compatible)
    tag29 +
    field("52", "5999") +      // MCC
    field("53", currency) +    // Currency
    field("54", amountStr) +   // Amount
    field("58", "KH") +        // Country
    field("59", storeName) +   // Store name
    field("60", city) +        // City
    "6304";                    // CRC placeholder

  const checksum = crc16(payload);

  return payload + checksum;
}

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.send("KHQR Backend Running");
});

app.post("/api/pay", (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Amount must be greater than 0"
    });
  }

  try {
    const qrString = generateKHQR(amount);

    res.json({
      success: true,
      amount: Number(amount),
      qrString: qrString
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("KHQR Server running on port " + PORT);
});
