const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const SaleSchema = new Schema(
  generateFields({
    client: { type: String, default: "" },
    movement: { type: String, default: "" },
    invoice: { type: String, default: "" },
    discount: { type: Number, default: 0 },
    userUuid: { required: true, type: String },
    warehouseUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Sale = mongoose.model("sale", SaleSchema, "sale");
module.exports = Sale;
