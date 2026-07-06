import { body, validationResult } from "express-validator";
import ContactInquiry from "../models/ContactInquiry.js";
import { sendContactNotificationEmail } from "../utils/emailService.js";
import catchAsync from "../utils/catchAsync.js";

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
      if (val === "" || val === null) return true;
      // Must be valid MongoDB ObjectId if provided
      if (/^[0-9a-fA-F]{24}$/.test(val)) return true;
      throw new Error("Invalid project reference format");
    }),
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/contact  — submit contact enquiry form
// ─────────────────────────────────────────────────────────────────────────────
export const createInquiry = [
  ...inquiryValidation,
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;

    const { name, email, phone, subject, message, interestedProject } = req.body;

    // Set status workflow to 'New'
    // Source defaults to 'Project Enquiry' if project ID is provided, else 'Website Contact Form'
    const source = interestedProject ? "Project Enquiry" : "Website Contact Form";

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

    const inquiry = await ContactInquiry.create({
      name,
      email,
      phone,
      subject: subject || undefined,
      message,
      interestedProject: interestedProject || null,
      status: "New",
      source,
      attachments,
    });

    // Call asynchronous stub service (logs to console for Phase 4)
    // Runs in background or awaited. Let's await for simplicity.
    await sendContactNotificationEmail(inquiry);

    // CRITICAL SECURITY: Do NOT return internal DB fields or details back to public
    res.status(201).json({
      success: true,
      message: "Thank you! We'll get back to you shortly.",
    });
  }),
];
