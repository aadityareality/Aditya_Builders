import { body, param, validationResult } from "express-validator";
import Project from "../models/Project.js";
import catchAsync from "../utils/catchAsync.js";
import { cloudinary } from "../config/cloudinary.js";

// ─── Validation helpers ───────────────────────────────────────────────────────
const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return false;
  }
  return true;
};

const mongoId = (field = "id") =>
  param(field).isMongoId().withMessage(`Invalid ${field} format`);

export const projectValidation = [
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("status")
    .isIn(["Ongoing", "Completed", "Upcoming"])
    .withMessage("Status must be Ongoing, Completed, or Upcoming"),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("type")
    .optional()
    .isIn(["Residential", "Commercial", "Residential + Commercial"])
    .withMessage("Invalid project type"),
  body("saleableArea.minSqFt")
    .optional()
    .isNumeric()
    .withMessage("saleableArea.minSqFt must be a number"),
  body("saleableArea.maxSqFt")
    .optional()
    .isNumeric()
    .withMessage("saleableArea.maxSqFt must be a number")
    .custom((val, { req }) => {
      const min = Number(req.body["saleableArea.minSqFt"] ?? req.body?.saleableArea?.minSqFt);
      const max = Number(val);
      if (!isNaN(min) && !isNaN(max) && max < min) {
        throw new Error("saleableArea.maxSqFt must be >= minSqFt");
      }
      return true;
    }),
];

// ─── Slug generator ───────────────────────────────────────────────────────────
const toSlug = (str) =>
  str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/projects  — paginated list, supports ?status= ?type= ?page= ?limit=
// ─────────────────────────────────────────────────────────────────────────────
export const getProjects = catchAsync(async (req, res) => {
  const { status, type, page = 1, limit = 10 } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (type)   filter.type = type;

  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .sort({ displayOrder: 1, createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: projects,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getProject = [
  mongoId(),
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, data: project });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/admin/projects
// ─────────────────────────────────────────────────────────────────────────────
export const createProject = [
  ...projectValidation,
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;

    const payload = { ...req.body };

    // Auto-generate slug from title if not provided
    if (!payload.slug) payload.slug = toSlug(payload.title);

    // Ensure slug uniqueness
    const existing = await Project.findOne({ slug: payload.slug });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Slug "${payload.slug}" already exists. Provide a unique slug.`,
      });
    }

    // Parse array string fields from FormData
    if (payload.contactNumbers) {
      try { payload.contactNumbers = JSON.parse(payload.contactNumbers); } catch { /* ignore */ }
    }
    if (payload.amenities) {
      try { payload.amenities = JSON.parse(payload.amenities); } catch { /* ignore */ }
    }
    // Parse saleableArea from FormData JSON string
    if (payload.saleableArea && typeof payload.saleableArea === "string") {
      try { payload.saleableArea = JSON.parse(payload.saleableArea); } catch { /* ignore */ }
    }

    // Parse coverImage from FormData JSON string if it's not a file upload
    if (payload.coverImage && typeof payload.coverImage === "string") {
      try { payload.coverImage = JSON.parse(payload.coverImage); } catch { /* ignore */ }
    }

    // Map cover image file if uploaded
    if (req.files && req.files["coverImage"] && req.files["coverImage"][0]) {
      const file = req.files["coverImage"][0];
      payload.coverImage = { url: file.path, publicId: file.filename };
    }

    // Map gallery image files if uploaded
    const gallery = [];
    if (req.files && req.files["gallery"]) {
      req.files["gallery"].forEach((file) => {
        gallery.push({ url: file.path, publicId: file.filename });
      });
    }
    payload.gallery = gallery;

    // Map brochure file if uploaded
    if (req.files && req.files["brochure"] && req.files["brochure"][0]) {
      const file = req.files["brochure"][0];
      payload.brochure = { url: file.path, publicId: file.filename, uploadedAt: new Date() };
    } else if (payload.brochure && typeof payload.brochure === "string") {
      try { payload.brochure = JSON.parse(payload.brochure); } catch { /* ignore */ }
    }

    const project = await Project.create(payload);
    res.status(201).json({ success: true, data: project });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/projects/:id
// ─────────────────────────────────────────────────────────────────────────────
export const updateProject = [
  mongoId(),
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;

    const updates = { ...req.body };

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Parse array fields from FormData
    if (updates.contactNumbers) {
      try { updates.contactNumbers = JSON.parse(updates.contactNumbers); } catch { /* ignore */ }
    }
    if (updates.amenities) {
      try { updates.amenities = JSON.parse(updates.amenities); } catch { /* ignore */ }
    }
    // Parse saleableArea from FormData JSON string
    if (updates.saleableArea && typeof updates.saleableArea === "string") {
      try { updates.saleableArea = JSON.parse(updates.saleableArea); } catch { /* ignore */ }
    }

    // Re-generate slug if title changed and no explicit slug given
    if (updates.title && !updates.slug) {
      updates.slug = toSlug(updates.title);
    }

    // Check slug uniqueness
    if (updates.slug) {
      const conflict = await Project.findOne({
        slug: updates.slug,
        _id: { $ne: req.params.id },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Slug "${updates.slug}" is already taken by another project.`,
        });
      }
    }

    // Handle cover image replacement
    if (req.files && req.files["coverImage"] && req.files["coverImage"][0]) {
      const file = req.files["coverImage"][0];
      // Delete old cover image from Cloudinary
      if (project.coverImage && project.coverImage.publicId) {
        try {
          await cloudinary.uploader.destroy(project.coverImage.publicId);
        } catch (err) {
          console.warn("Failed to delete old project cover image from Cloudinary:", err.message);
        }
      }
      updates.coverImage = { url: file.path, publicId: file.filename };
    } else if (updates.coverImage && typeof updates.coverImage === "string") {
      try {
        updates.coverImage = JSON.parse(updates.coverImage);
      } catch {
        /* ignore */
      }
    }

    // Handle brochure PDF replacement
    if (req.files && req.files["brochure"] && req.files["brochure"][0]) {
      const file = req.files["brochure"][0];
      // Delete old brochure from Cloudinary (must pass resource_type: "raw")
      if (project.brochure && project.brochure.publicId) {
        try {
          await cloudinary.uploader.destroy(project.brochure.publicId, { resource_type: "raw" });
        } catch (err) {
          console.warn("Failed to delete old project brochure from Cloudinary:", err.message);
        }
      }
      updates.brochure = { url: file.path, publicId: file.filename, uploadedAt: new Date() };
    } else if (updates.brochure && typeof updates.brochure === "string") {
      try {
        updates.brochure = JSON.parse(updates.brochure);
      } catch {
        /* ignore */
      }
    }

    // Handle gallery update
    let existingGallery = [];
    if (updates.existingGallery) {
      try {
        existingGallery = JSON.parse(updates.existingGallery);
      } catch {
        existingGallery = Array.isArray(updates.existingGallery) ? updates.existingGallery : [];
      }
    }

    // Destroy any deleted gallery images in Cloudinary
    if (project.gallery && project.gallery.length > 0) {
      const remainingIds = new Set(existingGallery.map((img) => img.publicId).filter(Boolean));
      for (const oldImg of project.gallery) {
        if (oldImg.publicId && !remainingIds.has(oldImg.publicId)) {
          try {
            await cloudinary.uploader.destroy(oldImg.publicId);
          } catch (err) {
            console.warn(`Failed to delete removed gallery photo ${oldImg.publicId} from Cloudinary:`, err.message);
          }
        }
      }
    }

    // Map new gallery uploads
    const newGalleryUploads = [];
    if (req.files && req.files["gallery"]) {
      req.files["gallery"].forEach((file) => {
        newGalleryUploads.push({ url: file.path, publicId: file.filename });
      });
    }

    updates.gallery = [...existingGallery, ...newGalleryUploads];

    // Apply updates
    Object.assign(project, updates);
    await project.save();

    res.status(200).json({ success: true, data: project });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/admin/projects/:id  — soft delete (isActive: false) + media cleanup
// ─────────────────────────────────────────────────────────────────────────────
export const deleteProject = [
  mongoId(),
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    // Clean up cover image from Cloudinary
    if (project.coverImage && project.coverImage.publicId) {
      try {
        await cloudinary.uploader.destroy(project.coverImage.publicId);
      } catch (err) {
        console.warn("Failed to delete project cover on deactivation:", err.message);
      }
    }

    // Clean up gallery images from Cloudinary
    if (project.gallery && project.gallery.length > 0) {
      for (const img of project.gallery) {
        if (img.publicId) {
          try {
            await cloudinary.uploader.destroy(img.publicId);
          } catch (err) {
            console.warn("Failed to delete project gallery photo on deactivation:", err.message);
          }
        }
      }
    }

    // Set isActive: false and clear out references
    project.isActive = false;
    project.coverImage = { url: null, publicId: null };
    project.gallery = [];
    await project.save();

    res.status(200).json({ success: true, message: "Project deactivated and Cloudinary media cleared", data: project });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/projects/:id/restore
// ─────────────────────────────────────────────────────────────────────────────
export const restoreProject = [
  mongoId(),
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });
    res.status(200).json({ success: true, message: "Project restored", data: project });
  }),
];

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/projects/:id/feature  — toggle isFeatured
// ─────────────────────────────────────────────────────────────────────────────
export const toggleFeature = [
  mongoId(),
  catchAsync(async (req, res) => {
    if (!validate(req, res)) return;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.isFeatured = !project.isFeatured;
    await project.save();

    res.status(200).json({
      success: true,
      message: `Project ${project.isFeatured ? "featured" : "unfeatured"}`,
      data: project,
    });
  }),
];
