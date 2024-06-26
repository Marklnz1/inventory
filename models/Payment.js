const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "invoice" },
    amount: Number,
    state: String,
    method: String,
  },
  { timestamps: true }
);
const Payment = mongoose.model("payment", PaymentSchema, "payment");
module.exports = Payment;
