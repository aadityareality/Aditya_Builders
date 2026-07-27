import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

async function inspectLuxuriaBlank() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log("Connected to MongoDB.");

  const names = [
    "SONALBEN M AGARVAT",
    "SONALBEN K RATHOD",
    "MANJULABEN P PITHADIYA",
    "MINABEN K GOHEL",
    "SEJALBEN P LASHKARI",
    "CHANDRIKABEN NAKRANI",
    "YOGESH"
  ];

  console.log(`\nInspecting ${names.length} LUXURIA blank phone names in DB:`);
  for (const n of names) {
    const custs = await Customer.find({ name: new RegExp(`^${n}$`, "i") });
    if (custs.length === 0) {
      console.log(`❌ NOT FOUND IN DB: "${n}"`);
    } else {
      for (const c of custs) {
        console.log(`FOUND: Name="${c.name}", Phone="${c.phone}", Category="${c.category}", Tags=${JSON.stringify(c.tags)}`);
      }
    }
  }

  process.exit(0);
}

inspectLuxuriaBlank();
