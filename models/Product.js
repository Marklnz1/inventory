const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const ProductSchema = new Schema(
  generateFields({
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    description: { type: String, default: "" },
    stock: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
  }),
  { timestamps: true }
);
const Product = mongoose.model("product", ProductSchema, "product");
module.exports = Product;
