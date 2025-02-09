const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const InvoiceSchema = new Schema(
  generateFields({
    cashRegister: { type: String, default: "" },
    client: { type: String, default: "" },
    userUuid: { required: true, type: String },
    warehouseUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Invoice = mongoose.model("invoice", InvoiceSchema, "invoice");
module.exports = Invoice;
