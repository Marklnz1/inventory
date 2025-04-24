const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const PaymentSchema = new Schema(
  generateFields({
    invoice: { type: String },
    client: { type: String },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    description: { type: String },
    userUuid: { required: true, type: String },
    warehouse: { type: String },
  }),
  { timestamps: true }
);
const Payment = mongoose.model("payment", PaymentSchema, "payment");
module.exports = Payment;
