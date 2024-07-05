const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CashRegisterSchema = new Schema(
  {
    code:Number,
    state:String,
    startingAmount:Number,
    closedAt:Date,
    efective:Number,
    yape:Number,
    transference:Number
  },
  { timestamps: true }
);
const CashRegister = mongoose.model("cashRegister", CashRegisterSchema, "cashRegister");
module.exports = CashRegister;
