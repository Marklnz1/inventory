const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
  {
    amount: Number,
    state: String,
    method: String,
    description:String,
  },
  { timestamps: true }
);
const Payment = mongoose.model("payment", PaymentSchema, "payment");
module.exports = Payment;
