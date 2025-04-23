const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const PaymentMethodSchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    priority: { type: Number, required: true },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const PaymentMethod = mongoose.model(
  "paymentMethod",
  PaymentMethodSchema,
  "paymentMethod"
);
module.exports = PaymentMethod;
