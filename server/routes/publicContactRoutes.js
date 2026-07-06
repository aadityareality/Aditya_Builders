import express from "express";
import rateLimit from "express-rate-limit";
import { createInquiry } from "../controllers/publicContactController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Stricter rate limiter — max 5 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many message submissions from this IP. Please try again after 15 minutes.",
  },
});

import multer from "multer";

const memoryUpload = multer();

// Gracefully handle file uploads if Cloudinary is configured
const handleUpload = (req, res, next) => {
  const hasCloudinary = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY.trim() !== "";
  if (!hasCloudinary) {
    // Fallback: parse multipart form fields using memory storage uploader so req.body is populated!
    memoryUpload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: "Failed to parse contact form fields",
        });
      }
      next();
    });
    return;
  }

  upload.array("photos", 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "Failed to process image attachments",
      });
    }
    next();
  });
};

router.post("/", contactLimiter, handleUpload, createInquiry);

export default router;
