import mongoose from "mongoose";

const { Schema } = mongoose;

const conversationMemorySchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    projectsViewed: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    budgetMentioned: {
      type: String,
      default: "",
      trim: true,
    },
    preferredBhk: {
      type: String,
      default: "",
      trim: true,
    },
    preferredLocation: {
      type: String,
      default: "",
      trim: true,
    },
    previousQuestions: {
      type: [String],
      default: [],
    },
    lastSummary: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const ConversationMemory = mongoose.model("ConversationMemory", conversationMemorySchema);
export default ConversationMemory;
