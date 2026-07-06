import cloudinary from "cloudinary";

const { v2: cloudinaryV2 } = cloudinary;

/**
 * Configures the Cloudinary SDK (v1 legacy SDK, required for multer-storage-cloudinary@4).
 * Call this once at server startup.
 * Actual upload logic will be added in a later phase (multer-storage-cloudinary).
 */
const configureCloudinary = () => {
  cloudinaryV2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  console.log("☁️  Cloudinary configured");
};

export { cloudinaryV2 as cloudinary, configureCloudinary };
