import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Campaign Schema
 * Tracks aggregate marketing campaign broadcast runs and delivery status statistics.
 */
const campaignSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
    },
    messageType: {
      type: String,
      required: true,
      enum: ["text", "image", "document", "location", "template"],
    },
    body: {
      type: Schema.Types.Mixed,
      required: true,
    },
    targetCount: {
      type: Number,
      default: 0,
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);
export default Campaign;
