import "dotenv/config";
import mongoose from "mongoose";
import SiteSettings from "../models/SiteSettings.js";

async function updateSettingsLogo() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const settings = await SiteSettings.getSettings();
  settings.logo = {
    url: "/logo.jpg",
    publicId: "official_logo"
  };

  await settings.save();
  console.log("✅ SiteSettings database logo updated to /logo.jpg successfully!");

  process.exit(0);
}

updateSettingsLogo();
