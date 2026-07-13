import mongoose from "mongoose";

const { Schema } = mongoose;

const webhookLogSchema = new Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    processed: {
      type: Boolean,
      default: false,
      index: true,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

webhookLogSchema.index({ createdAt: -1 });

const WebhookLog = mongoose.model("WebhookLog", webhookLogSchema);
export default WebhookLog;
