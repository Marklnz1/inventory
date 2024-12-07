const mongoose = require("mongoose");
const { generateFields } = require("../utils/sync");
const Schema = mongoose.Schema;

const MovementSchema = new Schema(
  generateFields({
    product: { type: String },
    quantity: Number,
    price: Number,
  }),
  { timestamps: true }
);
const Movement = mongoose.model("movement", MovementSchema, "movement");
module.exports = Movement;
