const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const ProductTagSchema = new Schema(
  generateFields({
    product: { type: String, required: true },
    tag: { type: String, required: true },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const ProductTag = mongoose.model("productTag", ProductTagSchema, "productTag");
module.exports = ProductTag;
