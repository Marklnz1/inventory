const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const SaleSchema = new Schema(
  generateFields({
    client: { type: String },
    movement: { type: String, required: true },
    invoice: { type: String, required: true },
    price: { type: Number, required: true },
    promotionPrice: { type: Number },
    warehouseUuid: { required: true, type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Sale = mongoose.model("sale", SaleSchema, "sale");
module.exports = Sale;
