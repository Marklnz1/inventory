const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");

const Schema = mongoose.Schema;

const UserWarehouseSchema = new Schema(
  generateFields({
    user: { type: String, default: "" },
    warehouse: { type: String, default: "" },
  }),
  { timestamps: true }
);
const UserWarehouse = mongoose.model(
  "userWarehouse",
  UserWarehouseSchema,
  "userWarehouse"
);

module.exports = UserWarehouse;
