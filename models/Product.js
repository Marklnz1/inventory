const mongoose = require("mongoose");
const { generateFields } = require("../utils/sync");
const Schema = mongoose.Schema;
// Inserted: Insertado
// Deleted: Eliminado

const ProductSchema = new Schema(
  generateFields({
    name: String,
    price: Number,
    description: String,
    stock: Number,
    maxDiscount: Number,
  }),
  { timestamps: true }
);
// ProductSchema.index({ name: "text" });
const Product = mongoose.model("product", ProductSchema, "product");
// Product.createIndexes();
module.exports = Product;
