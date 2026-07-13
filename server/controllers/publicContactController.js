import { body, validationResult } from "express-validator";
import ContactInquiry from "../models/ContactInquiry.js";
import { sendContactNotificationEmail } from "../utils/emailService.js";
import catchAsync from "../utils/catchAsync.js";
import { sendCustomerInquiryConfirmation, sendAdminInquiryAlert } from "../src/services/whatsappService.js";

// Helper for express-validator result check
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

// ─── express-validator configuration for inquiries ───────────────────────────
export const inquiryValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .escape(),
  body("email")
    .trim()
    .isEmail().withMessage("Valid email is required")
    .normalizeEmail(),
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .escape(),
  body("message")
    .trim()
    .notEmpty().withMessage("Message is required")
    .escape(),
  body("subject")
    .optional()
    .trim()
    .escape(),
  body("interestedProject")
    .optional()
    .custom((val) => {
      if (val === "" || val === null || val === "null" || val === undefined) return true;
      // Must be valid MongoDB ObjectId if provided
      if (/^[0-9a-fA-F]{24}$/.test(val)) return true;
      throw new Error("Invalid project reference format");
    }),
  body("utmSource").optional().trim().escape(),
  body("utmMedium").optional().trim().escape(),
  body("utmCampaign").optional().trim().escape(),
  body("referenceImage").optional().trim(),
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact  — submit contact enquiry form
// ─────────────────────────────────────────────────────────────────────────────
export const createInquiry = [
  ...inquiryValidation,
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;

    const {
      name,
      email,
      phone,
      subject,
      message,
      interestedProject,
      utmSource,
      utmMedium,
      utmCampaign,
      referenceImage,
    } = req.body;

    // Set status workflow to 'New'
    // Source defaults to 'Project Enquiry' if project ID is provided, else 'Website Contact Form'
    const source = (interestedProject && interestedProject !== "null") ? "Project Enquiry" : "Website Contact Form";

    // Map photo attachments if any exist
    const attachments = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        attachments.push({
          url: file.path,
          publicId: file.filename || file.public_id || `upload-${Date.now()}`,
        });
      });
    }

    // Append reference image from gallery if selected
    if (referenceImage) {
      try {
        const refImg = JSON.parse(referenceImage);
        if (refImg.url) {
          attachments.push({
            url: refImg.url,
            publicId: refImg.publicId || "gallery-ref",
          });
        }
      } catch (e) {
        if (typeof referenceImage === "string" && referenceImage.startsWith("http")) {
          attachments.push({
            url: referenceImage,
            publicId: "gallery-ref",
          });
        }
      }
    }

    const inquiry = await ContactInquiry.create({
      name,
      email,
      phone,
      subject: subject || undefined,
      message,
      interestedProject: (interestedProject && interestedProject !== "null") ? interestedProject : null,
      status: "New",
      source,
      attachments,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
    });

    // Populate interestedProject so the email and WhatsApp have access to the details
    if (inquiry.interestedProject) {
      try {
        await inquiry.populate("interestedProject", "title startingPrice location");
      } catch (err) {
        console.warn("⚠️ Failed to populate interestedProject for lead notifications:", err.message);
      }
    }

    // Call asynchronous service, wrapped in a non-blocking try/catch just in case,
    // so email errors NEVER crash the customer form success response.
    try {
      await sendContactNotificationEmail(inquiry);
    } catch (err) {
      console.error("⚠️ Failed to trigger lead notification email:", err.message);
    }

    // Send WhatsApp notification to Customer
    try {
      const projectTitle = inquiry.interestedProject?.title || "";
      const customerRes = await sendCustomerInquiryConfirmation(inquiry.phone, inquiry.name, projectTitle);
      
      const wamid = customerRes?.messages?.[0]?.id;
      if (wamid) {
        inquiry.whatsappCustomerMessageId = wamid;
      }
      inquiry.whatsappCustomerMessageStatus = "sent";
    } catch (err) {
      console.error("⚠️ Failed to trigger WhatsApp confirmation to customer:", err.message);
      inquiry.whatsappCustomerMessageStatus = "failed";
    }

    // Send WhatsApp notification to Admin
    try {
      await sendAdminInquiryAlert(inquiry);
      inquiry.whatsappAdminNotified = true;
    } catch (err) {
      console.error("⚠️ Failed to trigger WhatsApp alert to admin:", err.message);
      inquiry.whatsappAdminNotified = false;
    }

    // Persist WhatsApp status tracking updates
    try {
      await inquiry.save();
    } catch (saveErr) {
      console.error("⚠️ Failed to save WhatsApp tracking details to inquiry:", saveErr.message);
    }

    // CRITICAL SECURITY: Do NOT return internal DB fields or details back to public
    res.status(201).json({
      success: true,
      message: "Thank you! We'll get back to you shortly.",
    });
  }),
];
