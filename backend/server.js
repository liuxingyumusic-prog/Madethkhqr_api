require("dotenv").config();
const express = require("express");
const QRCode = require("qrcode");
const crc = require("crc");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

/* ---------------- MEMORY STORAGE ---------------- */
/* WARNING: Will reset when Render restarts */
const transactions = {};

/* ---------------- KHQR GENERATOR ---------------- */

function generateKHQR(amount, txnId) {
  let payload = "";

  payload += "000201"; // Format
  payload += "010212"; // Dynamic QR

  const merchantInfo = `0016A0000006770101110113${process.env.MERCHANT_ID}`;
  payload += "29" + merchantInfo.length.toString().padStart(2, "0") + merchantInfo;

  payload += "52045999"; // MCC
  payload += "5303840";  // USD
  payload += "54" + amount.length.toString().padStart(2, "0") + amount;
  payload += "5802KH";

  payload += "59" + process.env.STORE_NAME.length.toString().padStart(2, "0") + process.env.STORE_NAME;
  payload += "60" + process.env.CITY.length.toString().padStart(2, "0") + process.env.CITY;

  const additionalField = "05" + txnId.length.toString().padStart(2, "0") + txnId;
  payload += "62" + additionalField.length.toString().padStart(2, "0") + additionalField;

  payload += "6304";

  const crcValue = crc.crc16xmodem(payload)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  return payload + crcValue;
}

/* ---------------- CREATE PAYMENT ---------------- */

app.post("/create-payment", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Amount required" });
    }

    const txnId = uuidv4().replace(/-/g, "").substring(0, 12);

    const khqrString = generateKHQR(amount, txnId);
    const qrImage = await QRCode.toDataURL(khqrString);

    transactions[txnId] = {
      amount,
      status: "PENDING",
      createdAt: Date.now()
    };

    res.json({
      success: true,
      txnId,
      qrImage
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------- CHECK PAYMENT ---------------- */

app.get("/check-payment/:txnId", (req, res) => {
  const txn = transactions[req.params.txnId];

  if (!txn) {
    return res.status(404).json({ status: "NOT_FOUND" });
  }

  res.json({
    status: txn.status
  });
});

/* ---------------- SIMULATE PAYMENT (TEST ONLY) ---------------- */

app.post("/simulate-payment/:txnId", (req, res) => {
  const txn = transactions[req.params.txnId];

  if (!txn) {
    return res.status(404).json({ error: "Transaction not found" });
  }

  txn.status = "PAID";

  res.json({ message: "Payment marked as PAID" });
});

/* ---------------- AUTO CLEAN OLD TRANSACTIONS ---------------- */

setInterval(() => {
  const now = Date.now();
  for (let txnId in transactions) {
    if (now - transactions[txnId].createdAt > 15 * 60 * 1000) {
      delete transactions[txnId];
    }
  }
}, 60000);

/* ---------------- START SERVER ---------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
