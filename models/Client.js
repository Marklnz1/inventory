const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const ClientSchema = new Schema(
  generateFields({
    dni: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Client = mongoose.model("client", ClientSchema, "client");
module.exports = Client;
