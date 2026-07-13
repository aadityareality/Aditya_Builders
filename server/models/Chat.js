import mongoose from "mongoose";

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true, // Only one active/archive conversation thread document per customer
    },
    status: {
      type: String,
      enum: ["Open", "Closed", "Pending", "Archived"],
      default: "Open",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

chatSchema.index({ status: 1 });

const Chat = mongoose.model("Chat", chatSchema);
export default Chat;
