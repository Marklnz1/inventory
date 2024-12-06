const mongoose = require("mongoose");
const { generateFields } = require("../utils/syncronization");
const Schema = mongoose.Schema;

const ClientSchema = new Schema(
  generateFields({
    dni: String,
    name: String,
    phone: String,
    email: String,
  }),
  { timestamps: true }
);
const Client = mongoose.model("client", ClientSchema, "client");
module.exports = Client;
