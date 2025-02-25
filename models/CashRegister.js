const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const CashRegisterSchema = new Schema(
  generateFields({
    startingAmount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: false },
    closedAt: { type: Number, default: 0 },
    cash: { type: Number, default: 0 },
    userUuid: { required: true, type: String },
    warehouseUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const CashRegister = mongoose.model(
  "cashRegister",
  CashRegisterSchema,
  "cashRegister"
);
module.exports = CashRegister;
