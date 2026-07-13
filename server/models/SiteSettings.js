import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * SiteSettings Schema — SINGLETON document
 * ─────────────────────────────────────────
 * Only ONE document of this model should ever exist in the database.
 * It holds all admin-editable global settings: company info, contact
 * details, social links, About page text, and logo.
 *
 * Use the static method SiteSettings.getSettings() instead of
 * findOne() directly — it guarantees the document is created with
 * sensible defaults if it doesn't exist yet.
 */
const siteSettingsSchema = new Schema(
  {
    /** Official company name used in page titles and footer */
    companyName: {
      type: String,
      default: "Aditya Builders",
      trim: true,
    },

    /** Marketing tagline used on the homepage hero section */
    tagline: {
      type: String,
      default: "You Dream it, We Build it.",
      trim: true,
    },

    /**
     * Short About Us paragraph — used on the homepage in the
     * "About" preview section (≤ 2–3 sentences).
     */
    aboutUsShort: {
      type: String,
      default:
        "Aditya Builders is a trusted construction and real estate company based in Bhavnagar, Gujarat, with over 15 years of experience delivering quality homes and commercial spaces.",
    },

    /**
     * Full About Us content — used on the dedicated /about page.
     * Pre-filled with real company information from Instagram bio context.
     */
    aboutUsFull: {
      type: String,
      default:
        "Aditya Builders has been shaping the skyline of Bhavnagar, Gujarat for over 15 years. Founded on the twin pillars of Quality and Trust, we have proudly served more than 1,000 happy customers across residential and commercial projects. Our commitment to timely delivery, superior construction standards, and transparent dealings sets us apart in the real estate landscape of Saurashtra. From affordable 2 BHK apartments to premium 3 BHK residences, every Aditya Builders project is crafted with care, purpose, and the customer's dream at its heart. Quality + Time = Aditya.",
    },

    /** Number of years of experience — shown in the stats counter on homepage */
    yearsOfExperience: {
      type: Number,
      default: 15,
    },

    /** Total happy customers milestone figure — shown in stats counter */
    happyCustomers: {
      type: Number,
      default: 1000,
    },

    /** Total completed projects count — admin increments as projects are delivered */
    projectsCompleted: {
      type: Number,
      default: 0,
    },

    /** Full registered office address shown on the Contact page and footer */
    address: {
      type: String,
      default:
        "Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat",
    },

    /**
     * One or more public contact numbers.
     * Array because the business may list a main line + a project sales line.
     */
    phoneNumbers: {
      type: [String],
      default: ["+91 99748 58500"],
    },

    /** General enquiries email address shown publicly */
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    /** Official Instagram profile URL */
    instagramUrl: {
      type: String,
      default: "https://instagram.com/adityabuilders_",
    },

    /** Facebook page URL (optional) */
    facebookUrl: {
      type: String,
    },

    /**
     * WhatsApp number (with country code, no spaces or dashes).
     * Used to generate a wa.me/ deep-link on the contact page.
     * e.g. "919974858500"
     */
    whatsappNumber: {
      type: String,
    },

    /** Latitude coordinates for the company office */
    mapLatitude: {
      type: Number,
      default: null,
    },

    /** Longitude coordinates for the company office */
    mapLongitude: {
      type: Number,
      default: null,
    },

    /**
     * Google Maps embed URL for the iframe on the Contact page.
     * Obtain from Google Maps → Share → Embed a map → copy the src URL.
     * If not manually set, will be computed server-side from mapLatitude/mapLongitude.
     */
    mapEmbedUrl: {
      type: String,
    },
    
    /** Office operational timings */
    officeHours: {
      type: String,
      default: "Mon-Sat: 9:30 AM - 7:00 PM",
      trim: true,
    },

    /**
     * Company logo stored in Cloudinary.
     * url      — CDN URL used in <img> tags throughout the site.
     * publicId — Cloudinary public_id to delete the old logo when replacing.
     */
    logo: {
      url:      { type: String, default: null },
      publicId: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// ─── Static Method: getSettings ───────────────────────────────────────────────
/**
 * Retrieves the singleton SiteSettings document.
 * If no document exists yet, creates one with all schema defaults.
 * Always use this method instead of SiteSettings.findOne() to avoid
 * the site breaking when settings haven't been configured yet.
 *
 * @returns {Promise<Document>} The SiteSettings document
 */
siteSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
    console.log("📋 SiteSettings document created with defaults.");
  }
  return settings;
};

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);
export default SiteSettings;
