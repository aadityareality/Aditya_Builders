import mongoose from "mongoose";

const { Schema } = mongoose;

const faqSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    answer: {
      type: String,
      required: [true, "Answer is required"],
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
  },
  { timestamps: true }
);

faqSchema.index({ question: "text" });

const FAQ = mongoose.model("FAQ", faqSchema);
export default FAQ;
