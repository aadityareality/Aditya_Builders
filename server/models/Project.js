import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Cloudinary image sub-document shape — reused across multiple models.
 * url      — CDN-served image URL from Cloudinary.
 * publicId — Cloudinary public_id used for deletion/transformation.
 *            Store this so the image can be deleted from Cloudinary
 *            when the document is removed or the image is replaced.
 */
const imageSchema = new Schema(
  {
    url:      { type: String, default: null },
    publicId: { type: String, default: null },
  },
  { _id: false } // no separate _id needed for embedded image objects
);

/**
 * Project Schema
 * Represents a real estate / construction project listing
 * (e.g. "Aaditya Elegance", "Aaditya Skyline", "Shreeji Aaditya").
 */
const projectSchema = new Schema(
  {
    /** Human-readable project title shown publicly */
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
    },

    /**
     * URL-safe unique identifier — auto-generated from title if omitted.
     * Used in frontend routes: /projects/:slug
     */
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    /** Project category — drives filtering on the Projects page */
    type: {
      type: String,
      enum: ["Residential", "Commercial", "Residential + Commercial"],
      default: "Residential",
    },

    /** BHK or unit configuration, e.g. "2 BHK", "2/3 BHK" */
    configuration: {
      type: String,
      trim: true,
    },

    /**
     * Saleable / Super Built-Up (SB) area of the unit.
     * minSqFt — required lower bound (or only value for a fixed area).
     * maxSqFt — optional upper bound; if omitted, treated as a single
     *           fixed area (e.g. Aaditya Skyline = 1060 sq.ft exactly).
     */
    saleableArea: {
      minSqFt: {
        type: Number,
        validate: {
          validator: function (val) {
            // maxSqFt must be >= minSqFt when both are present
            if (this.saleableArea?.maxSqFt !== undefined && this.saleableArea.maxSqFt !== null) {
              return this.saleableArea.maxSqFt >= val;
            }
            return true;
          },
          message: "saleableArea.maxSqFt must be greater than or equal to minSqFt",
        },
      },
      maxSqFt: { type: Number, default: null },
    },

    /** Current build status — shown as a badge on the project card */
    status: {
      type: String,
      enum: ["Ongoing", "Completed", "Upcoming"],
      required: [true, "Project status is required"],
    },

    /** Locality / neighbourhood description shown on the listing */
    location: {
      type: String,
      required: [true, "Project location is required"],
      trim: true,
    },

    /** Long-form marketing description for the project detail page */
    description: {
      type: String,
      required: [true, "Project description is required"],
    },

    /**
     * Marketing price string kept as String (not Number) because Indian
     * real estate prices are displayed as formatted labels, not computed
     * values. e.g. "₹31.20 Lakh onwards"
     */
    startingPrice: {
      type: String,
      trim: true,
    },

    /** Estimated possession / handover date, e.g. "Dec 2026" */
    possessionDate: {
      type: String,
      trim: true,
    },

    /**
     * One or more contact numbers specific to this project.
     * Array because marketing brochures often list multiple lines.
     */
    contactNumbers: {
      type: [String],
      default: [],
    },

    /** List of amenity tags, e.g. ["CCTV", "Parking", "24/7 Water"] */
    amenities: {
      type: [String],
      default: [],
    },

    /**
     * Primary listing image — stored as Cloudinary url + publicId pair.
     * publicId is required to delete the old image when replacing it.
     */
    coverImage: {
      type: imageSchema,
      default: () => ({ url: null, publicId: null }),
    },

    /**
     * Additional project photos for the image gallery on the detail page.
     * Each entry is a Cloudinary url + publicId pair.
     */
    gallery: {
      type: [imageSchema],
      default: [],
    },

    /**
     * RERA registration number — mandatory disclosure for Indian real
     * estate projects under the Real Estate (Regulation and Development)
     * Act, 2016. Optional here as some projects may be pre-RERA.
     */
    reraNumber: {
      type: String,
      trim: true,
    },

    /**
     * If true, this project is shown in the "Featured Projects" section
     * on the homepage. Controlled from the admin panel.
     */
    isFeatured: {
      type: Boolean,
      default: false,
    },

    /**
     * Soft-delete flag — set to false instead of deleting the document.
     * Only active (true) projects are shown publicly.
     */
    isActive: {
      type: Boolean,
      default: true,
    },

    /**
     * Controls the display order in lists / carousels.
     * Lower number = higher position. Editable in the admin panel.
     */
    displayOrder: {
      type: Number,
      default: 0,
    },
    brochure: {
      url: { type: String, default: null },
      publicId: { type: String, default: null },
      uploadedAt: { type: Date, default: null },
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    availableUnits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// ─── Indexes ───────────────────────────────────────────────────────────────────
// Note: slug already has a unique index from `unique: true` on the field.
// Only add additional compound or non-unique indexes here.
projectSchema.index({ isFeatured: 1 });          // filter featured projects on homepage
projectSchema.index({ isActive: 1, status: 1 }); // filter active projects by status

// ─── Pre-Save Hook: Auto-generate slug from title if not provided ──────────────
projectSchema.pre("save", function (next) {
  if (!this.isModified("title") && this.slug) return next();
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  next();
});

const Project = mongoose.model("Project", projectSchema);
export default Project;
