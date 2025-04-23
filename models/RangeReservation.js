const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const RangeReservationSchema = new Schema(
  generateFields({
    minimumPurchase: { type: Number, required: true },
    quantifiableType: { required: true, type: String },
    value: { type: Number, required: true },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const RangeReservation = mongoose.model(
  "rangeReservation",
  RangeReservationSchema,
  "rangeReservation"
);
module.exports = RangeReservation;
