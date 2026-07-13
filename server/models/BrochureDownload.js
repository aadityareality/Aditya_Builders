import mongoose from "mongoose";

const { Schema } = mongoose;

const brochureDownloadSchema = new Schema(
  {
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
  },
  { timestamps: true }
);

brochureDownloadSchema.index({ projectId: 1 });
brochureDownloadSchema.index({ customerPhone: 1 });

const BrochureDownload = mongoose.model("BrochureDownload", brochureDownloadSchema);
export default BrochureDownload;
