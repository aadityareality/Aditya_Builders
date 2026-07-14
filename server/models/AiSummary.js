import mongoose from "mongoose";

const { Schema } = mongoose;

const aiSummarySchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    budgetMentioned: {
      type: String,
      default: "",
    },
    interestedProjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    leadScore: {
      type: Number,
      default: 0,
    },
    questionsAsked: {
      type: [String],
      default: [],
    },
    appointmentBooked: {
      type: Boolean,
      default: false,
    },
    suggestedNextAction: {
      type: String,
      default: "",
    },
    summaryText: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const AiSummary = mongoose.model("AiSummary", aiSummarySchema);
export default AiSummary;
