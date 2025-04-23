const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const QuantityPromoSchema = new Schema(
  generateFields({
    campaign: { type: String, required: true },
    product: { type: String, required: true },
    discountType: { type: String, required: true },
    discount: { required: true, type: Number },
    quantityRequired: { required: true, type: Number },
    description: { type: String },
    discountProduct: { type: String, required: true },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const QuantityPromo = mongoose.model(
  "quantityPromo",
  QuantityPromoSchema,
  "quantityPromo"
);
module.exports = QuantityPromo;
