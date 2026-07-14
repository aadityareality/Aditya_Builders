import mongoose from "mongoose";

const { Schema } = mongoose;

const recommendationLogSchema = new Schema(
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
    projectsRecommended: [
      {
        type: Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
    criteria: {
      budget: { type: String, default: "" },
      bhk: { type: String, default: "" },
      location: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

const RecommendationLog = mongoose.model("RecommendationLog", recommendationLogSchema);
export default RecommendationLog;
