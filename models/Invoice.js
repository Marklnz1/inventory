const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const InvoiceSchema = new Schema(
  generateFields({
    cashRegister: { type: String, default: "" },
    clientDni: { type: String, default: "" },
  }),
  { timestamps: true }
);
const Invoice = mongoose.model("invoice", InvoiceSchema, "invoice");
module.exports = Invoice;
