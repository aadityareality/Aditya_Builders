import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * ContactInquiry Schema
 * Stores submissions from the public "Contact Us" form and project
 * enquiry forms. Admin manages these from the hidden admin panel.
 * Never exposed publicly — admin read-only after creation.
 */
const contactInquirySchema = new Schema(
  {
    /** Sender's full name from the contact form */
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    /** Sender's email address — used for follow-up correspondence */
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/,
        "Please provide a valid email address",
      ],
    },

    /** Sender's mobile / contact number */
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    /** Optional short subject line from the contact form */
    subject: {
      type: String,
      trim: true,
    },

    /** The full message or enquiry text submitted by the visitor */
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },

    /**
     * If the enquiry originated from a specific project page,
     * this field links it back to that Project document.
     * Helps admin understand the context of each enquiry.
     */
    interestedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },

    /**
     * Admin workflow status.
     * "New"       — just submitted, not yet reviewed.
     * "Contacted" — admin has reached out to the enquirer.
     * "Closed"    — resolved or no follow-up needed.
     */
    status: {
      type: String,
      enum: ["New", "Contacted", "Closed"],
      default: "New",
    },

    /**
     * Tracks where the enquiry originated from.
     * Useful for analytics and understanding which touchpoint
     * generates the most leads.
     */
    source: {
      type: String,
      enum: ["Website Contact Form", "Project Enquiry", "Other"],
      default: "Website Contact Form",
    },

    /** Optional photo attachments of site / plots / floor plans */
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      default: [],
    },

    /** Internal notes jotted down by admin sales follow-up team */
    internalNotes: {
      type: String,
      default: "",
      trim: true,
    },

    /** UTM Marketing source parameters details */
    utmSource: {
      type: String,
      default: null,
      trim: true,
    },
    utmMedium: {
      type: String,
      default: null,
      trim: true,
    },
    utmCampaign: {
      type: String,
      default: null,
      trim: true,
    },
    whatsappCustomerMessageId: {
      type: String,
      default: null,
      trim: true,
    },
    whatsappCustomerMessageStatus: {
      type: String,
      enum: ["not_sent", "sent", "delivered", "read", "failed"],
      default: "not_sent",
    },
    whatsappAdminNotified: {
      type: Boolean,
      default: false,
    },
    referenceId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

// ─── Pre-save hook to generate referenceId ──────────────────────────────────
contactInquirySchema.pre("save", function (next) {
  if (!this.referenceId && this._id) {
    const shortId = this._id.toString().substring(16).toUpperCase();
    this.referenceId = `AD-${shortId}`;
  }
  next();
});

// ─── Indexes ───────────────────────────────────────────────────────────────────
contactInquirySchema.index({ status: 1 });           // admin filters by status (New/Contacted/Closed)
contactInquirySchema.index({ createdAt: -1 });       // latest enquiries first
contactInquirySchema.index({ status: 1, createdAt: -1 }); // compound: filter + sort

const ContactInquiry = mongoose.model("ContactInquiry", contactInquirySchema);
export default ContactInquiry;
