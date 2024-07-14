const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MovementSchema = new Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
    code: { type: Number, required: true},
    uuid: { type: String, required: true, unique: true },
    quantity: Number,
    price: Number,
    state: String,
  },
  { timestamps: true }
);
const Movement = mongoose.model("movement", MovementSchema, "movement");
module.exports = Movement;
