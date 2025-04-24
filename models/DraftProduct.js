const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const DraftProductSchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    product: { type: String },
    description: { type: String },
    userUuid: { required: true, type: String },
    warehouse: { required: true, type: String },
  }),
  { timestamps: true }
);
const DraftProduct = mongoose.model(
  "draftProduct",
  DraftProductSchema,
  "draftProduct"
);
module.exports = DraftProduct;
