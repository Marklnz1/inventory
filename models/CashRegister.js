const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CashRegisterSchema = new Schema(
  {
    code: { type: Number, required: true },
    uuid: { type: String, required: true, unique: true },
    state: String,
    startingAmount: Number,
    closedAt: Date,
    efective: Number,
    yape: Number,
    transference: Number,
    createdAtLocal: Date,
    updatedAtLocal: Date,
  },
  { timestamps: true }
);
const CashRegister = mongoose.model(
  "cashRegister",
  CashRegisterSchema,
  "cashRegister"
);
module.exports = CashRegister;
