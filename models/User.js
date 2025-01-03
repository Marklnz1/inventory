const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    username: String,
    password: String,
    role: String,
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const User = mongoose.model("user", UserSchema, "user");

module.exports = User;
