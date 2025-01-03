const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const MovementSchema = new Schema(
  generateFields({
    product: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    description: { type: String, default: "" },
  }),
  { timestamps: true }
);
const Movement = mongoose.model("movement", MovementSchema, "movement");
module.exports = Movement;
