const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RegisterCashSchema = new Schema(
  {
    sales: { type: mongoose.Schema.Types.ObjectId, ref: "sale" },
    amount: Number,
    state: String,
    method: String,
  },
  { timestamps: true }
);
const RegisterCash = mongoose.model(
  "register_cash",
  RegisterCashSchema,
  "register_cash"
);
module.exports = RegisterCash;
