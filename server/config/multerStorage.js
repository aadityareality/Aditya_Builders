import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "./cloudinary.js";

// Allowed formats and transformation standard settings
const standardParams = (folder) => ({
  folder,
  allowed_formats: ["jpg", "jpeg", "png", "webp"],
  transformation: [
    { width: 1920, height: 1920, crop: "limit", quality: "auto", fetch_format: "auto" }
  ],
});

// ─── 1. Storage Configurations ───────────────────────────────────────────────
export const projectCoverStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/projects/covers"),
});

export const projectGalleryStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/projects/gallery"),
});

export const siteGalleryStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/gallery"),
});

export const testimonialPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/testimonials"),
});

export const teamPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/team"),
});

export const siteLogoStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/branding"),
});

export const contactAttachmentStorage = new CloudinaryStorage({
  cloudinary,
  params: standardParams("adityabuilders/inquiries"),
});

// Dynamic Project Combined Storage (maps to covers vs gallery folder based on fieldname)
export const projectCombinedStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === "brochure") {
      return {
        folder: "adityabuilders/projects/brochures",
        resource_type: "raw",
      };
    }
    const isCover = file.fieldname === "coverImage";
    return standardParams(
      isCover ? "adityabuilders/projects/covers" : "adityabuilders/projects/gallery"
    );
  },
});

// ─── 2. Multer Instances (5MB limits, files filtering) ───────────────────────
const limits = { fileSize: 5 * 1024 * 1024 };

const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const projectFileFilter = (req, file, cb) => {
  if (file.fieldname === "brochure") {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed for brochure!"), false);
    }
  } else {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
};

// Expose multer middlewares
export const uploadProjectCover = multer({
  storage: projectCoverStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadProjectGallery = multer({
  storage: projectGalleryStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadSiteGallery = multer({
  storage: siteGalleryStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadTestimonialPhoto = multer({
  storage: testimonialPhotoStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadTeamPhoto = multer({
  storage: teamPhotoStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadSiteLogo = multer({
  storage: siteLogoStorage,
  limits,
  fileFilter: imageFileFilter,
});

export const uploadContactAttachment = multer({
  storage: contactAttachmentStorage,
  limits,
  fileFilter: imageFileFilter,
});

// Combined project files handler (handles coverImage [1] + gallery [10] + brochure [1] in one middleware)
export const uploadProjectFiles = multer({
  storage: projectCombinedStorage,
  limits,
  fileFilter: projectFileFilter,
}).fields([
  { name: "coverImage", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
  { name: "brochure", maxCount: 1 },
]);
