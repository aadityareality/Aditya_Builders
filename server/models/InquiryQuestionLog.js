import mongoose from "mongoose";

const { Schema } = mongoose;

const inquiryQuestionLogSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    projectName: {
      type: String,
      default: "",
      trim: true,
    },
    keywords: {
      type: [String],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

inquiryQuestionLogSchema.index({ phone: 1 });
inquiryQuestionLogSchema.index({ timestamp: -1 });

const InquiryQuestionLog = mongoose.model("InquiryQuestionLog", inquiryQuestionLogSchema);
export default InquiryQuestionLog;
