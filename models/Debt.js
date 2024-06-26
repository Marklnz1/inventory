const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DebtSchema = new Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "client" },
    amount: Number,
    description: String,
    type: String,
  },
  { timestamps: true }
);
module.exports = DebtSchema;
