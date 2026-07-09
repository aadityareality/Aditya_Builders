/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Aditya Builders — Database Seed Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Populates MongoDB with initial dummy + real data for development and staging.
 *
 * Usage:
 *   npm run seed            (from the server/ directory)
 *   node utils/seedData.js
 *
 * ⚠️  WARNING: This script CLEARS all existing data in every collection
 *   before inserting fresh seed data. Never run this against production.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

// ── Model imports ──────────────────────────────────────────────────────────────
import Admin          from "../models/Admin.js";
import Project        from "../models/Project.js";
import GalleryImage   from "../models/GalleryImage.js";
import Testimonial    from "../models/Testimonial.js";
import TeamMember     from "../models/TeamMember.js";
import SiteSettings   from "../models/SiteSettings.js";
import ContactInquiry from "../models/ContactInquiry.js";

// ─── Admin Credentials from .env ──────────────────────────────────────────────
const SEED_ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || "admin@adityabuilders.in";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe@123!";

if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
  console.warn(
    "\n⚠️  SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD not set in .env.\n" +
    "   Using example fallback values. Change them immediately in .env before seeding.\n"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────

// ── Projects ──────────────────────────────────────────────────────────────────
const projectsData = [
  {
    title:         "Aaditya Elegance",
    slug:          "aaditya-elegance",
    type:          "Residential",
    configuration: "2/3 BHK",
    status:        "Ongoing",
    location:      "Swaminarayan Green City, Bhavnagar",
    description:
      "Aaditya Elegance is a premium residential project offering spacious 2 and 3 BHK apartments crafted with attention to detail. Nestled in the serene Swaminarayan Green City locality of Bhavnagar, this project blends modern architecture with thoughtful amenities for a comfortable family lifestyle.",
    startingPrice:  "₹31.20 Lakh onwards",
    possessionDate: "Dec 2026",
    contactNumbers: ["+91 99748 58500"],
    amenities: [
      "24*7 Security",
      "2 Big Size Lift",
      "Solar Power for Common Area",
      "House Keeping Service",
      "Fire Safety",
      "Waiting Area",
      "Basement for Parking",
      "Senior Citizen Area",
      "Entrance Foyer",
      "CCTV Surveillance",
      "Common Toilet",
      "Rain Water Harvesting System",
    ],
    coverImage: {
      url:      "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418933/aaditya_elegance/media__1783414692421.png",
      publicId: "aaditya_elegance/media__1783414692421",
    },
    gallery: [
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418935/aaditya_elegance/media__1783414713459.png", publicId: "aaditya_elegance/media__1783414713459" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418936/aaditya_elegance/media__1783414734613.jpg", publicId: "aaditya_elegance/media__1783414734613" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418937/aaditya_elegance/media__1783414822379.png", publicId: "aaditya_elegance/media__1783414822379" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418940/aaditya_elegance/media__1783414838391.png", publicId: "aaditya_elegance/media__1783414838391" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418943/aaditya_elegance/media__1783415198963.png", publicId: "aaditya_elegance/media__1783415198963" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418946/aaditya_elegance/media__1783415217464.png", publicId: "aaditya_elegance/media__1783415217464" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418948/aaditya_elegance/media__1783415231892.png", publicId: "aaditya_elegance/media__1783415231892" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783420478/aaditya_elegance/media__1783419956920.png", publicId: "aaditya_elegance/media__1783419956920" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783420479/aaditya_elegance/media__1783419981889.png", publicId: "aaditya_elegance/media__1783419981889" },
      { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783420480/aaditya_elegance/media__1783420089102.png", publicId: "aaditya_elegance/media__1783420089102" },
    ],
    reraNumber:    "GJ/BHV/HARERA/2024/001",
    isFeatured:    true,
    isActive:      true,
    displayOrder:  1,
    saleableArea: { minSqFt: 1336, maxSqFt: 1655 },
  },
  {
    title:         "Aaditya Skyline",
    slug:          "aaditya-skyline",
    type:          "Residential",
    configuration: "2 BHK",
    status:        "Ongoing",
    location:      "Near Jewels Circle, Bhavnagar",
    description:
      "Aaditya Skyline offers contemporary 2 BHK residences in one of Bhavnagar's most accessible locations — just minutes from Jewels Circle. The project is designed for urban families seeking quality construction, vastu-compliant layouts, and excellent connectivity to schools, hospitals, and commercial hubs.",
    startingPrice:  "₹24.50 Lakh onwards",
    possessionDate: "Mar 2027",
    contactNumbers: ["+91 99748 58500"],
    amenities: [
      "Lift",
      "CCTV Surveillance",
      "24/7 Water Supply",
      "Visitor Parking",
      "Terrace Garden",
      "Power Backup",
    ],
    coverImage: {
      url:      "https://placehold.co/800x500/3B82C4/FFFFFF?text=Aaditya+Skyline",
      publicId: "seed/aaditya-skyline-cover",
    },
    gallery: [
      { url: "https://placehold.co/800x500/2563A0/FFFFFF?text=Skyline+Gallery+1", publicId: "seed/skyline-g1" },
      { url: "https://placehold.co/800x500/6DA5D8/FFFFFF?text=Skyline+Gallery+2", publicId: "seed/skyline-g2" },
    ],
    isFeatured:   true,
    isActive:     true,
    displayOrder: 2,
    saleableArea: { minSqFt: 1060, maxSqFt: null },
  },
  {
    title:         "Shreeji Aaditya",
    slug:          "shreeji-aaditya",
    type:          "Residential",
    configuration: "2 BHK",
    status:        "Ongoing",
    location:      "Shivomnagar, Bhavnagar",
    description:
      "Shreeji Aaditya is an ongoing residential project offering 2 BHK homes in Shivomnagar, Bhavnagar. Built to Aditya Builders' hallmark standards of quality and timely possession, Shreeji Aaditya stands as a testament to our promise — Quality + Time = Aditya.",
    startingPrice:  "₹18.75 Lakh onwards",
    possessionDate: "Jun 2023",
    contactNumbers: ["+91 99748 58500"],
    amenities: [
      "Lift",
      "24/7 Water Supply",
      "Covered Parking",
      "Security Guard",
    ],
    coverImage: {
      url:      "https://res.cloudinary.com/dcysihl0/image/upload/v1783428010/adityabuilders/projects/gallery/jnsihf2lcrs1eoymtso6.png",
      publicId: "adityabuilders/projects/gallery/jnsihf2lcrs1eoymtso6",
    },
    gallery: [
      { url: "https://placehold.co/800x500/6B625A/FFFFFF?text=Shreeji+Gallery+1", publicId: "seed/shreeji-g1" },
    ],
    isFeatured:   true,
    isActive:     true,
    displayOrder: 3,
    saleableArea: { minSqFt: 1100, maxSqFt: 1500 },
  },
];

// ── Gallery Images ─────────────────────────────────────────────────────────────
const galleryData = [
  {
    title:        "Day View Elevation — Aaditya Elegance",
    category:     "Exterior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418933/aaditya_elegance/media__1783414692421.png", publicId: "aaditya_elegance/media__1783414692421" },
    displayOrder: 1,
  },
  {
    title:        "Night View Elevation — Aaditya Elegance",
    category:     "Exterior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418935/aaditya_elegance/media__1783414713459.png", publicId: "aaditya_elegance/media__1783414713459" },
    displayOrder: 2,
  },
  {
    title:        "Aerial Layout View — Aaditya Elegance",
    category:     "Exterior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418936/aaditya_elegance/media__1783414734613.jpg", publicId: "aaditya_elegance/media__1783414734613" },
    displayOrder: 3,
  },
  {
    title:        "3D 2 BHK Floor Plan — Aaditya Elegance",
    category:     "Interior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418937/aaditya_elegance/media__1783414822379.png", publicId: "aaditya_elegance/media__1783414822379" },
    displayOrder: 4,
  },
  {
    title:        "3D 3 BHK Floor Plan — Aaditya Elegance",
    category:     "Interior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418940/aaditya_elegance/media__1783414838391.png", publicId: "aaditya_elegance/media__1783414838391" },
    displayOrder: 5,
  },
  {
    title:        "Brochure Amenities — Aaditya Elegance",
    category:     "Interior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418943/aaditya_elegance/media__1783415198963.png", publicId: "aaditya_elegance/media__1783415198963" },
    displayOrder: 6,
  },
  {
    title:        "Premium Lobby & Passage — Aaditya Elegance",
    category:     "Interior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418946/aaditya_elegance/media__1783415217464.png", publicId: "aaditya_elegance/media__1783415217464" },
    displayOrder: 7,
  },
  {
    title:        "Premium Drawing Room — Aaditya Elegance",
    category:     "Interior",
    image:        { url: "https://res.cloudinary.com/dclc4tor2/image/upload/v1783418948/aaditya_elegance/media__1783415231892.png", publicId: "aaditya_elegance/media__1783415231892" },
    displayOrder: 8,
  },
];

// ── Testimonials ───────────────────────────────────────────────────────────────
const testimonialsData = [
  {
    customerName:  "Rajesh Patel",
    projectName:   "Shreeji Aaditya",
    rating:        5,
    message:
      "Aditya Builders delivered our 2 BHK flat on time and the build quality is outstanding. Every corner of the flat is finished beautifully. Highly recommend them to anyone looking for a reliable builder in Bhavnagar.",
    isApproved:    true,
    isFeatured:    true,
  },
  {
    customerName:  "Priya Shah",
    projectName:   "Aaditya Elegance",
    rating:        5,
    message:
      "We booked a 3 BHK in Aaditya Elegance and the experience from booking to site visits has been wonderful. The team is transparent, responsive, and the construction quality visible even at this stage is remarkable.",
    isApproved:    true,
    isFeatured:    true,
  },
  {
    customerName:  "Mehul Bhatt",
    projectName:   "Shreeji Aaditya",
    rating:        5,
    message:
      "After exploring many builders in Bhavnagar, we chose Aditya Builders and we are very satisfied. The flat is spacious, vastu-compliant, and the amenities are exactly as promised. The possession was on the exact date committed — very trustworthy company.",
    isApproved:    true,
    isFeatured:    false,
  },
];

// ── Team Members ───────────────────────────────────────────────────────────────
const teamData = [
  {
    name:         "Aditya Bhai",
    designation:  "Founder & Director",
    bio:
      "With over 15 years of experience in construction and real estate development across Bhavnagar and Saurashtra, Aditya Bhai founded Aditya Builders on the belief that every family deserves a quality home delivered with integrity and on time.",
    displayOrder: 1,
    isActive:     true,
  },
  {
    name:         "Rakesh Solanki",
    designation:  "Senior Site Engineer",
    bio:
      "Rakesh brings over 10 years of structural engineering expertise to every Aditya Builders project. He oversees construction quality, contractor coordination, and ensures all work adheres to IS codes and the builder's exacting standards.",
    displayOrder: 2,
    isActive:     true,
  },
];

// ── Site Settings — REAL data, not dummy ──────────────────────────────────────
const siteSettingsData = {
  companyName:       "Aditya Builders",
  tagline:           "You Dream it, We Build it. Quality + Time = Aditya",
  aboutUsShort:
    "Aditya Builders is a trusted construction and real estate company based in Bhavnagar, Gujarat, with over 15 years of experience and 1000+ happy customers.",
  aboutUsFull:
    "Aditya Builders has been shaping the skyline of Bhavnagar, Gujarat for over 15 years. Founded on the twin pillars of Quality and Trust, we have proudly served more than 1,000 happy customers across residential and commercial projects. Our commitment to timely delivery, superior construction standards, and transparent dealings sets us apart in the real estate landscape of Saurashtra. From affordable 2 BHK apartments to premium 3 BHK residences, every Aditya Builders project is crafted with care, purpose, and the customer's dream at its heart. Quality + Time = Aditya.",
  yearsOfExperience: 15,
  happyCustomers:    1000,
  projectsCompleted: 15,
  address:
    "Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat",
  phoneNumbers:  ["+91 99748 58500"],
  email:         "parthrajsinhparmar4115@gmail.com",
  instagramUrl:  "https://instagram.com/adityabuilders_",
  whatsappNumber: "919974858500",
  mapLatitude:   21.75979,
  mapLongitude:  72.12433,
  mapEmbedUrl:   null, // Leave blank so server-side auto-generation is tested
};

// ─────────────────────────────────────────────────────────────────────────────
// SEED RUNNER
// ─────────────────────────────────────────────────────────────────────────────
const seed = async () => {
  try {
    await connectDB();
    console.log("\n🌱 Starting seed...\n");

    // ── Clear all collections ─────────────────────────────────────────────────
    console.log("🗑️  Clearing existing collections...");
    await Promise.all([
      Admin.deleteMany({}),
      Project.deleteMany({}),
      GalleryImage.deleteMany({}),
      Testimonial.deleteMany({}),
      TeamMember.deleteMany({}),
      SiteSettings.deleteMany({}),
      ContactInquiry.deleteMany({}),
    ]);
    console.log("   ✓ All collections cleared.\n");

    // ── Seed Admin ────────────────────────────────────────────────────────────
    // Password hashing is handled automatically by the pre-save hook in Admin.js
    const admin = await Admin.create({
      name:     "Super Admin",
      email:    SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      role:     "superadmin",
    });
    console.log(`👤 Admin created: ${admin.email}`);

    // ── Seed Projects ─────────────────────────────────────────────────────────
    const projects = await Project.insertMany(projectsData);
    console.log(`🏗️  Projects created: ${projects.length}`);

    // ── Seed Gallery Images (link first two to projects) ──────────────────────
    const galleryWithRefs = galleryData.map((img, i) => ({
      ...img,
      relatedProject: i < 2 ? projects[i]?._id : null,
    }));
    const gallery = await GalleryImage.insertMany(galleryWithRefs);
    console.log(`🖼️  Gallery images created: ${gallery.length}`);

    // ── Seed Testimonials (link to matching projects where possible) ──────────
    const testimonialsWithRefs = testimonialsData.map((t, i) => ({
      ...t,
      relatedProject: projects[i]?._id ?? null,
    }));
    const testimonials = await Testimonial.insertMany(testimonialsWithRefs);
    console.log(`💬 Testimonials created: ${testimonials.length}`);

    // ── Seed Team Members ─────────────────────────────────────────────────────
    const team = await TeamMember.insertMany(teamData);
    console.log(`👥 Team members created: ${team.length}`);

    // ── Seed Site Settings (real data) ────────────────────────────────────────
    const settings = await SiteSettings.create(siteSettingsData);
    console.log(`⚙️  Site settings created: ${settings.companyName}`);

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log("\n✅ Seed completed successfully!");
    console.log("─────────────────────────────────────────");
    console.log(`   Admins:          1`);
    console.log(`   Projects:        ${projects.length}`);
    console.log(`   Gallery images:  ${gallery.length}`);
    console.log(`   Testimonials:    ${testimonials.length}`);
    console.log(`   Team members:    ${team.length}`);
    console.log(`   Site settings:   1`);
    console.log("─────────────────────────────────────────");
    console.log(`\n🔐 Admin login: ${SEED_ADMIN_EMAIL}`);
    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn(
        "⚠️  Default password used — set SEED_ADMIN_PASSWORD in .env and re-seed!"
      );
    }
    console.log("");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    console.error(err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
