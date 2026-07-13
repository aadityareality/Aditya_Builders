/**
 * uploadAadityaSkylineImages.mjs
 * One-time seed script to upload 5 Aaditya Skyline photos.
 *
 *  Photo 1 - Main view       -> Project gallery + Site gallery
 *  Photo 2 - Night view      -> Project gallery + Site gallery
 *  Photo 3 - Shopping shops  -> Project gallery + Site gallery
 *  Photo 4 - Basement plan   -> Project gallery ONLY
 *  Photo 5 - Ground plan     -> Project gallery ONLY
 *
 * USAGE (from /server directory):
 *   node scripts/uploadAadityaSkylineImages.mjs
 *
 * Place images in: server/scripts/skyline-images/
 *   01_main_view.jpg
 *   02_night_view.jpg
 *   03_shopping_shops.jpg
 *   04_basement_floor_plan.jpg
 *   05_ground_floor_plan.jpg
 */

import "dotenv/config";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import cloudinary from "cloudinary";

const { v2: cloudinaryV2 } = cloudinary;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Minimal inline models ──────────────────────────────────────────────────────
const imageSchema = new mongoose.Schema(
  { url: { type: String, default: null }, publicId: { type: String, default: null } },
  { _id: false }
);

const Project = mongoose.models.Project || mongoose.model("Project", new mongoose.Schema(
  {
    title: String, slug: { type: String, unique: true, lowercase: true },
    gallery: { type: [imageSchema], default: [] },
    coverImage: { type: imageSchema, default: () => ({ url: null, publicId: null }) },
    type: String, configuration: String, status: String, location: String,
    description: String, startingPrice: String, possessionDate: String,
    contactNumbers: { type: [String], default: [] }, amenities: { type: [String], default: [] },
    reraNumber: String, isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 },
    saleableArea: { minSqFt: Number, maxSqFt: { type: Number, default: null } },
  },
  { timestamps: true }
));

const GalleryImage = mongoose.models.GalleryImage || mongoose.model("GalleryImage", new mongoose.Schema(
  {
    title: String, category: { type: String, default: "Exterior" },
    image: { url: String, publicId: String },
    relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    isActive: { type: Boolean, default: true }, displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
));

// ── Image definitions ─────────────────────────────────────────────────────────
const IMAGES = [
  { filename: "01_main_view.jpg",              title: "Aaditya Skyline - Main View",          category: "Completed Project", addToGallery: true  },
  { filename: "02_night_view.jpg",             title: "Aaditya Skyline - Night View",         category: "Exterior",          addToGallery: true  },
  { filename: "03_shopping_shops.png",         title: "Aaditya Skyline - Ground Floor Shops", category: "Exterior",          addToGallery: true  },
  { filename: "04_basement_floor_plan.png",    title: "Aaditya Skyline - Basement Floor Plan",category: "Other",             addToGallery: false },
  { filename: "05_ground_floor_plan.png",      title: "Aaditya Skyline - Ground Floor Plan",  category: "Other",             addToGallery: false },
];

cloudinaryV2.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key:    (process.env.CLOUDINARY_API_KEY    || "").trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
  secure: true,
});

async function uploadToCloudinary(filePath, publicIdHint) {
  const result = await cloudinaryV2.uploader.upload(filePath, {
    folder: "aditya-builders/projects/aaditya-skyline",
    public_id: publicIdHint,
    overwrite: true,
    resource_type: "image",
  });
  return { url: result.secure_url, publicId: result.public_id };
}

async function main() {
  const IMAGES_DIR = path.join(__dirname, "skyline-images");

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`\nImages directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const missingFiles = IMAGES.filter(img => !fs.existsSync(path.join(IMAGES_DIR, img.filename)));
  if (missingFiles.length > 0) {
    console.error("\nMissing image files:");
    missingFiles.forEach(img => console.error(`  - ${img.filename}`));
    console.error("\nPlace the files in:", IMAGES_DIR, "\n");
    process.exit(1);
  }

  console.log("\nConnecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!\n");

  let project = await Project.findOne({ slug: "aaditya-skyline" });
  if (!project) project = await Project.findOne({ title: /aaditya skyline/i });
  if (!project) {
    console.error('Project "aaditya-skyline" not found in database.');
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found project: "${project.title}" (${project._id})\n`);

  for (const [i, imgDef] of IMAGES.entries()) {
    const filePath = path.join(IMAGES_DIR, imgDef.filename);
    const hint     = imgDef.filename.replace(/\.[^/.]+$/, "");

    console.log(`[${i + 1}/5] Uploading: ${imgDef.filename}`);
    let result;
    try {
      result = await uploadToCloudinary(filePath, hint);
    } catch (err) {
      console.error(`  FAILED: ${err.message}`);
      continue;
    }
    console.log(`  Uploaded -> ${result.url}`);

    project.gallery.push({ url: result.url, publicId: result.publicId });
    console.log("  Added to Project gallery");

    if (imgDef.addToGallery) {
      const ge = await GalleryImage.create({
        title: imgDef.title, category: imgDef.category,
        image: { url: result.url, publicId: result.publicId },
        relatedProject: project._id, isActive: true, displayOrder: 0,
      });
      console.log(`  Added to Site Gallery (id: ${ge._id})`);
    } else {
      console.log("  Skipped Site Gallery (floor plan - project only)");
    }
    console.log();
  }

  await project.save();
  console.log(`Project saved. Total gallery photos: ${project.gallery.length}`);

  await mongoose.disconnect();
  console.log("\nDone! All 5 Aaditya Skyline images uploaded successfully.\n");
}

main().catch(err => { console.error("Script failed:", err); process.exit(1); });
