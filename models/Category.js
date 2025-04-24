const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const CategorySchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    description: { type: String },
  }),
  { timestamps: true }
);
const Category = mongoose.model("category", CategorySchema, "category");
module.exports = Category;
