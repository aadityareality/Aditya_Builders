import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";

// Setup storage engine using the configured Cloudinary client
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "aditya_builders",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // Limit file sizes or transform automatically to save CDN bandwidth
    transformation: [{ width: 1200, crop: "limit" }],
  },
});

// Configure Multer limits (max 5MB file size)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

export default upload;
