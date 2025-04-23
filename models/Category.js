const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const CategorySchema = new Schema(
  generateFields({
    dni: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Category = mongoose.model("category", CategorySchema, "category");
module.exports = Category;
