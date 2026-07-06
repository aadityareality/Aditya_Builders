import { body, validationResult } from "express-validator";
import CallbackRequest from "../models/CallbackRequest.js";
import { sendCallbackNotificationEmail } from "../utils/emailService.js";
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

// Validation rules
export const callbackValidation = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .escape(),
  body("phone")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .escape(),
  body("preferredTime")
    .optional()
    .trim()
    .escape(),
  body("relatedProject")
    .optional()
    .custom((val) => {
      if (val === "" || val === null || val === "null" || val === undefined) return true;
      if (/^[0-9a-fA-F]{24}$/.test(val)) return true;
      throw new Error("Invalid project reference format");
    }),
];

/**
 * createCallbackRequest
 * POST /api/callback-request
 */
export const createCallbackRequest = [
  ...callbackValidation,
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;

    const { name, phone, preferredTime, relatedProject } = req.body;

    const callback = await CallbackRequest.create({
      name,
      phone,
      preferredTime: preferredTime || "Anytime",
      relatedProject: (relatedProject && relatedProject !== "null") ? relatedProject : null,
      status: "New",
    });

    // Populate relatedProject to have access to title in the email template
    if (callback.relatedProject) {
      await callback.populate("relatedProject", "title");
    }

    // Trigger instant Resend email alert
    await sendCallbackNotificationEmail(callback);

    res.status(201).json({
      success: true,
      message: "Callback request registered successfully. We will call you shortly!",
      data: callback,
    });
  }),
];
