import mongoose from "mongoose";

const { Schema } = mongoose;

const reminderLogSchema = new Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    reminderType: {
      type: String,
      enum: ["24h", "3h", "1h", "30m"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    attemptCount: {
      type: Number,
      default: 1,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metaResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

reminderLogSchema.index({ appointmentId: 1 });

const ReminderLog = mongoose.model("ReminderLog", reminderLogSchema);
export default ReminderLog;
