const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const MovementSchema = new Schema(
  generateFields({
    draftProduct: { type: String, required: true },
    quantity: { type: Number, required: true },
    cost: { type: Number },
    price: { type: Number, required: true },
    description: { type: String },
    originType: { required: true, type: String },
    origin: { type: String },
    destinationType: { required: true, type: String },
    destination: { type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Movement = mongoose.model("movement", MovementSchema, "movement");
module.exports = Movement;
