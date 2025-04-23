const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const ProductSchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String },
    includeGroupDiscount: { type: Boolean, required: true },
    description: { type: String },
    cost: { type: Number },
    promotionPrice: { type: Number },
    discountType: { type: String },
    discount: { required: true, type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Product = mongoose.model("product", ProductSchema, "product");
module.exports = Product;
