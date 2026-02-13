require("dotenv").config();
const express = require("express");
const QRCode = require("qrcode");
const crc = require("crc");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

/* ================= MEMORY STORAGE ================= */
const transactions = {};

/* ================= HOME PAGE ================= */

app.get("/", (req, res) => {
  res.send(`
    <h2>KHQR Payment Server Running 🚀</h2>
    <p>Use POST /create-payment</p>
  `);
});

/* ================= KHQR GENERATOR ================= */

function generateKHQR(amount, txnId) {
  let payload = "";

  payload += "000201";
  payload += "010212";

  const merchantId = "pichsomadeth_sorn1@bkrt";
  const storeName = "MADETH STORE";
  const city = "PHNOM PENH";

  const merchantInfo = `0016A0000006770101110113${merchantId}`;
  payload += "29" + merchantInfo.length.toString().padStart(2, "0") + merchantInfo;

  payload += "52045999";
  payload += "5303840";
  payload += "54" + amount.length.toString().padStart(2, "0") + amount;
  payload += "5802KH";

  payload += "59" + storeName.length.toString().padStart(2, "0") + storeName;
  payload += "60" + city.length.toString().padStart(2, "0") + city;

  const additional = "05" + txnId.length.toString().padStart(2, "0") + txnId;
  payload += "62" + additional.length.toString().padStart(2, "0") + additional;

  payload += "6304";

  const crcValue = crc.crc16xmodem(payload)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");

  return payload + crcValue;
}

/* ================= CREATE PAYMENT ================= */

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

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= CHECK PAYMENT ================= */

app.get("/check-payment/:txnId", (req, res) => {
  const txn = transactions[req.params.txnId];

  if (!txn) {
    return res.status(404).json({ status: "NOT_FOUND" });
  }

  res.json({ status: txn.status });
});

/* ================= SIMULATE PAYMENT ================= */

app.get("/pay/:txnId", (req, res) => {
  if (transactions[req.params.txnId]) {
    transactions[req.params.txnId].status = "PAID";
    res.send("Payment Marked as PAID ✅");
  } else {
    res.send("Transaction not found");
  }
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on " + PORT));
