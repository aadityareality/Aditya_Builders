import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Protected admin uploads route
router.post("/", protect, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided or file upload failed",
    });
  }

  // Multer Cloudinary storage returns path as the URL and filename as publicId
  const url = req.file.path;
  const publicId = req.file.filename || req.file.public_id || `upload-${Date.now()}`;

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    url,
    publicId,
  });
});

export default router;
