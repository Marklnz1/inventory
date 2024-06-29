const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema(
  {
    code: Number,
    name: String,
    price: Number,
    description: String,
    stock: Number,
    base64: String,
    state: String,
    maxDiscount: Number,
  },
  { timestamps: true }
);
// ProductSchema.index({ name: "text" });
const Product = mongoose.model("product", ProductSchema, "product");
// Product.createIndexes();
module.exports = Product;
