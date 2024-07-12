const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SaleSchema = new Schema(
  {
    code: Number,
    movement: { type: mongoose.Schema.Types.ObjectId, ref: "movement" },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "invoice" },
    discount: Number,
    state: String,

  },
  { timestamps: true }
);
const Sale = mongoose.model("sale", SaleSchema, "sale");
module.exports = Sale;
