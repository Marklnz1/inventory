const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema(
  {
    code: Number,
    total: Number,
    paid: Number,
    client: { type: mongoose.Schema.Types.ObjectId, ref: "client" },
    state: String,
  },
  { timestamps: true }
);
const Invoice = mongoose.model("invoice", InvoiceSchema, "invoice");
module.exports = Invoice;
