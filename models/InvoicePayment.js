const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoicePaymentSchema = new Schema(
  {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "invoice" },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "payment" },
  },
  { timestamps: true }
);
const InvoicePayment = mongoose.model("invoicePayment", InvoicePaymentSchema, "invoicePayment");
module.exports = InvoicePayment;
