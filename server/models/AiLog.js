import mongoose from "mongoose";

const { Schema } = mongoose;

const aiLogSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    customerPhone: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      required: true, // e.g. "completions", "whisper", "vision"
    },
    model: {
      type: String,
      required: true,
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const AiLog = mongoose.model("AiLog", aiLogSchema);
export default AiLog;
