require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const QRCode = require("qrcode");
const crc = require("crc");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("./models/Transaction");

const app = express();
app.use(express.json());

/* ------------------ DATABASE CONNECT ------------------ */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ------------------ KHQR GENERATOR ------------------ */

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

/* ------------------ CREATE PAYMENT ------------------ */

app.post("/create-payment", async (req, res) => {
  try {
    const { amount } = req.body;

    const txnId = uuidv4().replace(/-/g, "").substring(0, 12);

    const khqrString = generateKHQR(amount, txnId);
    const qrImage = await QRCode.toDataURL(khqrString);

    await Transaction.create({
      txnId,
      amount
    });

    res.json({
      success: true,
      txnId,
      qrImage
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ------------------ CHECK PAYMENT ------------------ */

app.get("/check-payment/:txnId", async (req, res) => {
  const { txnId } = req.params;

  const txn = await Transaction.findOne({ txnId });

  if (!txn) {
    return res.status(404).json({ status: "NOT_FOUND" });
  }

  res.json({
    status: txn.status
  });
});

/* ------------------ SIMULATE PAYMENT (TEST ONLY) ------------------ */

app.post("/simulate-payment/:txnId", async (req, res) => {
  const { txnId } = req.params;

  await Transaction.updateOne(
    { txnId },
    { status: "PAID" }
  );

  res.json({ message: "Payment marked as PAID" });
});

/* ------------------ SERVER ------------------ */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
