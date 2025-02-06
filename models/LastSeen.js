const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const LastSeenSchema = new Schema(
  generateFields({
    userUuid: { type: String, default: "" },
    movement: { type: String, default: "" },
    product: { type: String, default: "" },
    client: { type: String, default: "" },
    sale: { type: String, default: "" },
    warehouse: { type: String, default: "" },
    user: { type: String, default: "" },
    cashRegister: { type: String, default: "" },
  }),
  { timestamps: true }
);
const LastSeen = mongoose.model("lastSeen", LastSeenSchema, "lastSeen");
module.exports = LastSeen;
