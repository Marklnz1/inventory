const mongoose = require("mongoose");
const { generateFields } = require("../synchronization/sync");
const Schema = mongoose.Schema;
const CampaignSchema = new Schema(
  generateFields({
    name: { type: String, required: true },
    startDate: { type: Number, required: true },
    endDate: { type: Number, required: true },
    description: { type: String },
    userUuid: { required: true, type: String },
  }),
  { timestamps: true }
);
const Campaign = mongoose.model("campaign", CampaignSchema, "campaign");
module.exports = Campaign;
