import mongoose from "mongoose";

const { Schema } = mongoose;

const noteSchema = new Schema({
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true }
});

const customerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Customer phone is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    leadStatus: {
      type: String,
      enum: ["New", "Interested", "Follow Up", "Booked Visit", "Negotiation", "Won", "Lost", "Hot", "Warm", "Cold", "Booked"],
      default: "New",
    },
    interestedProject: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    assignedExecutive: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    budget: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    dealValue: {
      type: Number,
      default: null,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    internalNotes: [noteSchema],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    stage: {
      type: String,
      enum: ["New", "Engaged", "Site Visit Booked", "Negotiation", "Closed"],
      default: "New",
    },
    leadScore: {
      type: Number,
      default: 1,
    },
    source: {
      type: String,
      default: "Website",
    },
    followUp24hSent: {
      type: Boolean,
      default: false,
    },
    followUp3daySent: {
      type: Boolean,
      default: false,
    },
    followUp7daySent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

customerSchema.index({ assignedExecutive: 1 });
customerSchema.index({ leadStatus: 1 });
customerSchema.index({ lastMessageAt: -1 });
customerSchema.index({ email: 1 });
customerSchema.index({ priority: 1 });
customerSchema.index({ stage: 1 });
customerSchema.index({ tags: 1 });
customerSchema.index({ createdAt: -1 });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
