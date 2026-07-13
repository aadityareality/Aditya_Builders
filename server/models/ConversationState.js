import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationStateSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    currentFlow: {
      type: String,
      default: null,
    },
    currentStep: {
      type: Number,
      default: 0,
    },
    collectedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    previousFlow: {
      type: String,
      default: null,
    },
    previousStep: {
      type: Number,
      default: 0,
    },
    previousData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // updatedAt is updated on every state transition
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// TTL index to automatically clear state after 30 minutes of inactivity (1800 seconds)
conversationStateSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 1800 });

const ConversationState = mongoose.model("ConversationState", conversationStateSchema);
export default ConversationState;
