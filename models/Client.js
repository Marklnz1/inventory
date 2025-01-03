const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const ClientSchema = new Schema(
  generateFields({
    name: { type: String, default: "" },
    dni: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
  }),
  { timestamps: true }
);
const Client = mongoose.model("client", ClientSchema, "client");
module.exports = Client;
