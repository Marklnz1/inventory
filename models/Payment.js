const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const PaymentSchema = new Schema(
  generateFields({
    invoice: { type: String, default: "" },
    client: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    method: { type: String, default: "" },
    description: { type: String, default: "" },
  }),
  { timestamps: true }
);
const Payment = mongoose.model("payment", PaymentSchema, "payment");
module.exports = Payment;
