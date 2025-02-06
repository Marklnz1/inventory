const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  generateFields({
    username: { type: String, default: "" },
    password: { type: String, default: "" },
    warehouse: { type: String, default: "" },
    role: { type: String, default: "" },
    version: { type: Number, default: 0 },
  }),
  { timestamps: true }
);
const User = mongoose.model("user", UserSchema, "user");

module.exports = User;
