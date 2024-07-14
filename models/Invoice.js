const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvoiceSchema = new Schema(
  {
    code: { type: Number, required: true}, 
    uuid: { type: String, required: true, unique: true },
    total: Number,
    paid: Number,
    client: { type: mongoose.Schema.Types.ObjectId, ref: "client" },
    cashRegister:{ type: mongoose.Schema.Types.ObjectId, ref: "cashRegister" },
    state: String,
  },
  { timestamps: true }
);
const Invoice = mongoose.model("invoice", InvoiceSchema, "invoice");
module.exports = Invoice;
