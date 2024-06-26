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
  },
  { timestamps: true }
);
const Product = mongoose.model("product", ProductSchema, "product");
module.exports = Product;
