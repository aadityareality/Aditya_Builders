import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Project from "../models/Project.js";

const run = async () => {
  await connectDB();
  const list = await Project.find();
  console.log("Projects list in database:");
  list.forEach(p => {
    console.log(`- Title: ${p.title}`);
    console.log(`  Brochure field: ${JSON.stringify(p.brochure)}`);
  });
  await mongoose.connection.close();
};
run();
