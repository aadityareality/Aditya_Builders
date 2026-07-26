import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

import Project from "../models/Project.js";
import GalleryImage from "../models/GalleryImage.js";

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const artifactsDir = "C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\29fca85a-2d47-4ff6-9757-d93d74ff8b4f";

const photoFiles = {
  photo1: path.join(artifactsDir, "media__1785071482314.png"),
  photo2: path.join(artifactsDir, "media__1785071606910.png"),
  photo3: path.join(artifactsDir, "media__1785071644146.png"),
};

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGODB_URI environment variable missing.");

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Helper to upload a file to Cloudinary
    const uploadToCloudinary = async (filePath, folderName, customName) => {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      console.log(`Uploading ${customName} (${filePath}) to Cloudinary...`);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `adityabuilders/${folderName}`,
        public_id: customName,
        overwrite: true,
        resource_type: "auto"
      });
      console.log(`Uploaded ${customName} -> ${result.secure_url}`);
      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    };

    const p1Uploaded = await uploadToCloudinary(photoFiles.photo1, "aaditya_icon", "aaditya_icon_main");
    const p2Uploaded = await uploadToCloudinary(photoFiles.photo2, "aaditya_icon", "aaditya_icon_plans");
    const p3Uploaded = await uploadToCloudinary(photoFiles.photo3, "aaditya_icon", "aaditya_icon_amenities");

    // Upsert Project
    console.log("Upserting Project document for Aaditya Icon...");
    let project = await Project.findOne({ slug: "aaditya-icon" });
    if (!project) {
      project = new Project({
        title: "Aaditya Icon",
        slug: "aaditya-icon",
      });
    }

    project.title = "Aaditya Icon";
    project.slug = "aaditya-icon";
    project.type = "Residential";
    project.configuration = "2 BHK Apartment";
    project.saleableArea = {
      minSqFt: 1150,
      maxSqFt: null
    };
    project.startingPrice = ""; // Price on Request / hidden as instructed
    project.status = "Ongoing";
    project.location = "Plot No. 9, R.S. No. 209 Paiky, T.p.s. 24 Desainagar, Bhavnagar";
    project.description = "A BRIGHTER WAY HOME — Designed to welcome natural light, thoughtful spaces, and everyday comfort creating a home that feels uplifting, peaceful, and truly yours.";
    project.contactNumbers = ["+91 94269 19634"];
    project.amenities = [
      "Attractive Entry/Exit Gate",
      "Sit Out Area",
      "Fire Safety System",
      "CCTV Camera",
      "Security Cabin",
      "Car Parking",
      "Solar Panel (Common Area)",
      "Adani Gas Line",
      "Meter Room",
      "2 High Speed Lift",
      "24 Hrs. Water",
      "DTH & TV Cable Connection",
      "Common Toilet"
    ];
    project.coverImage = p1Uploaded;
    project.gallery = [p1Uploaded, p2Uploaded, p3Uploaded];
    project.isFeatured = true;
    project.isActive = true;

    await project.save();
    console.log(`✅ Project "Aaditya Icon" saved successfully! ID: ${project._id}`);

    // Add to GalleryImages collection
    console.log("Upserting GalleryImage documents for Aaditya Icon...");

    const galleryEntries = [
      {
        title: "Aaditya Icon Elevation",
        category: "Exterior",
        image: p1Uploaded,
        relatedProject: project._id,
        isActive: true,
        displayOrder: 1
      },
      {
        title: "Aaditya Icon Floor Plans & Layout",
        category: "Other",
        image: p2Uploaded,
        relatedProject: project._id,
        isActive: true,
        displayOrder: 2
      },
      {
        title: "Aaditya Icon Amenities & View",
        category: "Exterior",
        image: p3Uploaded,
        relatedProject: project._id,
        isActive: true,
        displayOrder: 3
      }
    ];

    for (const entry of galleryEntries) {
      await GalleryImage.updateOne(
        { "image.publicId": entry.image.publicId },
        { $set: entry },
        { upsert: true }
      );
    }
    console.log("✅ GalleryImage entries saved successfully!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error adding Aaditya Icon project:", err);
    process.exit(1);
  }
};

run();
