import "dotenv/config";
import mongoose from "mongoose";
import SiteSettings from "../models/SiteSettings.js";

async function updateBothNumbers() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const settings = await SiteSettings.getSettings();

  settings.phoneNumbers = ["+91 99748 58500", "+91 99981 12121"];
  settings.whatsappNumber = "919974858500";
  settings.address = "Shop no 9&10, Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat";
  settings.mapLatitude = 21.75979;
  settings.mapLongitude = 72.12433;
  settings.googleMapsUrl = "https://www.google.com/maps?q=21.75979,72.12433";

  await settings.save();

  console.log("=======================================================");
  console.log("✅ SiteSettings updated with both numbers in MongoDB:");
  console.log("Phone Numbers:", settings.phoneNumbers);
  console.log("Address:", settings.address);
  console.log("Google Maps URL:", settings.googleMapsUrl);
  console.log("=======================================================");

  process.exit(0);
}

updateBothNumbers();
