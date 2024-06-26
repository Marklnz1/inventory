const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScheduleSchema = new Schema(
  {
    state: String,
    vehicle: { type: String, ref: "vehicle" },
    client: { type: String, ref: "client" },
    date: Date,
  },
  { timestamps: true }
);
module.exports = ScheduleSchema;
