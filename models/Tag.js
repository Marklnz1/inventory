const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const TagSchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    type: { type: String },
    color: { type: Number, required: true },
    description: { type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Tag = mongoose.model("tag", TagSchema, "tag");
module.exports = Tag;
