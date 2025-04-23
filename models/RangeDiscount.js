const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const RangeDiscountSchema = new Schema(
  generateFields({
    minimumPurchase: { type: Number, required: true },
    discountType: { required: true, type: String },
    value: { type: Number, required: true },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const RangeDiscount = mongoose.model(
  "rangeDiscount",
  RangeDiscountSchema,
  "rangeDiscount"
);
module.exports = RangeDiscount;
