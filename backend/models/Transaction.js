const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  txnId: String,
  amount: String,
  status: {
    type: String,
    default: "PENDING"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
