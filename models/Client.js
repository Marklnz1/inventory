const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ClientSchema = new Schema(
  {
    dni: String,
    name: String,
    phone: String,
    email: String,
    state: String,
  },
  { timestamps: true }
);
const Client = mongoose.model("client", ClientSchema, "client");
module.exports = Client;
