const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SyncCodeTableSchema = new Schema(
  {
    product: { type: Number, required: true, default: 0 },
    sale: { type: Number, required: true, default: 0 },
    movement: { type: Number, required: true, default: 0 },
    invoice: { type: Number, required: true, default: 0 },
    payment: { type: Number, required: true, default: 0 },
    client: { type: Number, required: true, default: 0 },
    cashRegister: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);
const SyncCodeTable = mongoose.model(
  "syncCodeTable",
  SyncCodeTableSchema,
  "syncCodeTable"
);
module.exports = SyncCodeTable;
