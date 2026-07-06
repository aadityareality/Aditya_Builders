import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * CallbackRequest Schema
 * Represents lightweight call back requests (name + phone only).
 * Intended to be lower-friction than full inquiries.
 */
const callbackRequestSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    preferredTime: {
      type: String,
      default: "Anytime",
      trim: true,
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Closed"],
      default: "New",
    },
  },
  { timestamps: true }
);

// Indexes for admin listings performance
callbackRequestSchema.index({ status: 1 });
callbackRequestSchema.index({ createdAt: -1 });

const CallbackRequest = mongoose.model("CallbackRequest", callbackRequestSchema);
export default CallbackRequest;
