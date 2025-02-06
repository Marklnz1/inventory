const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");

const Schema = mongoose.Schema;

const WarehouseSchema = new Schema(
  generateFields({
    name: { type: String, default: "" },
    description: { type: String, default: "" },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Warehouse = mongoose.model("warehouse", WarehouseSchema, "warehouse");

module.exports = Warehouse;
