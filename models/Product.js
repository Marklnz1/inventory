const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// Inserted: Insertado
// Deleted: Eliminado
const fieldsBase = {
  name: String,
  price: Number,
  description: String,
  stock: Number,
  base64: String,
  status: String,
  maxDiscount: Number,
};
for (const key in fieldsBase) {
  if (fieldsBase.hasOwnProperty(key)) {
    fieldsBase[`${key}UpdatedAt`] = Date;
  }
}
const ProductSchema = new Schema(
  {
    uuid: String,
    syncCode: Number,
    ...fieldsBase,
  },
  { timestamps: true }
);
// ProductSchema.index({ name: "text" });
const Product = mongoose.model("product", ProductSchema, "product");
// Product.createIndexes();
module.exports = Product;
