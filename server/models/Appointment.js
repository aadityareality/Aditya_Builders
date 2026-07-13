import mongoose from "mongoose";

const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
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
    preferredDate: {
      type: Date,
      required: [true, "Preferred date is required"],
    },
    preferredTime: {
      type: String,
      required: [true, "Preferred time is required"],
      trim: true,
    },
    numberOfVisitors: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Confirmed", "Completed", "Cancelled", "Rescheduled"],
      default: "Confirmed",
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
    },
    referenceId: {
      type: String,
      default: null,
      trim: true,
    },
    remindersSent: {
      h24: { type: Boolean, default: false },
      h3:  { type: Boolean, default: false },
      h2:  { type: Boolean, default: false },
      h1:  { type: Boolean, default: false },
      m30: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate a short referenceId
appointmentSchema.pre("save", function (next) {
  if (!this.referenceId && this._id) {
    const shortId = this._id.toString().substring(18).toUpperCase(); // Last 6 hex digits
    this.referenceId = `APT-${shortId}`;
  }
  next();
});

appointmentSchema.index({ preferredDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ customerPhone: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
