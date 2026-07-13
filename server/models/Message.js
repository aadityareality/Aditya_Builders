import mongoose from "mongoose";

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    direction: {
      type: String,
      enum: ["incoming", "outgoing"],
      required: true,
    },
    messageType: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "audio",
        "document",
        "location",
        "contact",
        "template",
        "interactive",
        "sticker"
      ],
      required: true,
    },
    body: {
      type: Schema.Types.Mixed, // text body or structured object (e.g. lat/lng coordinates or Cloudinary links)
      required: true,
    },
    metaMessageId: {
      type: String,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered", "read", "seen", "failed"],
      default: "sent",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    sentBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1 });
messageSchema.index({ timestamp: 1 });
messageSchema.index({ metaMessageId: 1 }, { unique: true, sparse: true }); // Prevent duplicates
messageSchema.index({ chat: 1, isDeleted: 1, timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
