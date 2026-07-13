import mongoose from "mongoose";

const { Schema } = mongoose;

const messageStatusSchema = new Schema(
  {
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    previousStatus: {
      type: String,
      default: null,
    },
    newStatus: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    rawMetaPayload: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

messageStatusSchema.index({ message: 1 });
messageStatusSchema.index({ timestamp: 1 });

const MessageStatus = mongoose.model("MessageStatus", messageStatusSchema);
export default MessageStatus;
