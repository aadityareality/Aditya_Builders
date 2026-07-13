import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../hooks/api.js";
import ImageUpload from "../components/ImageUpload.jsx";
import toast from "react-hot-toast";
import { FiSave, FiArrowLeft, FiPlus, FiTrash2, FiTag } from "react-icons/fi";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

/**
 * ProjectForm Component
 * Shared for adding new project listings and editing existing listings.
 */
export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState(null);
  const [brochureFile, setBrochureFile] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    type: "Residential",
    configuration: "",
    status: "Ongoing",
    location: "",
    description: "",
    startingPrice: "",
    possessionDate: "",
    reraNumber: "",
    isFeatured: false,
    isActive: true,
    displayOrder: 0,
    coverImage: { url: "", publicId: "" },
    gallery: [],
    saleableArea: { minSqFt: "", maxSqFt: "" },
    brochure: { url: "", publicId: "", uploadedAt: "" },
  });

  // Dynamic Lists States
  const [contactNumbers, setContactNumbers] = useState([""]);
  const [amenities, setAmenities] = useState([]);
  const [newAmenity, setNewAmenity] = useState("");

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/projects/${id}`);
      if (data.success && data.data) {
        const p = data.data;
        setFormData({
          title: p.title || "",
          slug: p.slug || "",
          type: p.type || "Residential",
          configuration: p.configuration || "",
          status: p.status || "Ongoing",
          location: p.location || "",
          description: p.description || "",
          startingPrice: p.startingPrice || "",
          possessionDate: p.possessionDate || "",
          reraNumber: p.reraNumber || "",
          isFeatured: !!p.isFeatured,
          isActive: p.isActive !== undefined ? p.isActive : true,
          displayOrder: p.displayOrder || 0,
          coverImage: p.coverImage || { url: "", publicId: "" },
          gallery: p.gallery || [],
          saleableArea: {
            minSqFt: p.saleableArea?.minSqFt ?? "",
            maxSqFt: p.saleableArea?.maxSqFt ?? "",
          },
          brochure: p.brochure || { url: "", publicId: "", uploadedAt: "" },
        });
        setContactNumbers(p.contactNumbers?.length > 0 ? p.contactNumbers : [""]);
        setAmenities(p.amenities || []);
        setIsSlugManuallyEdited(true); // Don't auto-regenerate on edit load
      }
    } catch {
      toast.error("Could not fetch project details.");
      navigate(`${ADMIN_SLUG}/projects`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchProjectDetails();
    }
  }, [id]);

  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const next = { ...prev, title: val };
      if (!isSlugManuallyEdited) {
        next.slug = val
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }
      return next;
    });
  };

  const handleSlugChange = (val) => {
    setIsSlugManuallyEdited(true);
    setFormData((prev) => ({
      ...prev,
      slug: val
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, ""),
    }));
  };

  // Dynamic Contact Numbers Handlers
  const handleAddContactNumber = () => {
    setContactNumbers([...contactNumbers, ""]);
  };

  const handleRemoveContactNumber = (index) => {
    const updated = contactNumbers.filter((_, idx) => idx !== index);
    setContactNumbers(updated.length > 0 ? updated : [""]);
  };

  const handleContactNumberChange = (index, val) => {
    const updated = [...contactNumbers];
    updated[index] = val;
    setContactNumbers(updated);
  };

  // Dynamic Amenities Tag Handlers
  const handleAddAmenity = (e) => {
    e.preventDefault();
    const tag = newAmenity.trim();
    if (!tag) return;
    if (amenities.includes(tag)) {
      toast.error("Amenity already added.");
      return;
    }
    setAmenities([...amenities, tag]);
    setNewAmenity("");
  };

  const handleRemoveAmenity = (tagToRemove) => {
    setAmenities(amenities.filter((t) => t !== tagToRemove));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formData.title.trim()) return toast.error("Title is required");
    if (!formData.slug.trim()) return toast.error("Slug is required");
    if (!formData.location.trim()) return toast.error("Location is required");
    if (!formData.description.trim()) return toast.error("Description is required");

    // Saleable area cross-field validation
    const minSqFt = formData.saleableArea.minSqFt !== "" ? Number(formData.saleableArea.minSqFt) : null;
    const maxSqFt = formData.saleableArea.maxSqFt !== "" ? Number(formData.saleableArea.maxSqFt) : null;
    if (minSqFt !== null && isNaN(minSqFt)) return toast.error("Saleable Area Min must be a valid number");
    if (maxSqFt !== null && isNaN(maxSqFt)) return toast.error("Saleable Area Max must be a valid number");
    if (minSqFt !== null && maxSqFt !== null && maxSqFt < minSqFt) {
      return toast.error("Saleable Area Max must be ≥ Min Sq.Ft");
    }

    setSaving(true);

    const fd = new FormData();
    fd.append("title", formData.title);
    fd.append("slug", formData.slug);
    fd.append("type", formData.type);
    fd.append("configuration", formData.configuration);
    fd.append("status", formData.status);
    fd.append("location", formData.location);
    fd.append("description", formData.description);
    fd.append("startingPrice", formData.startingPrice);
    fd.append("possessionDate", formData.possessionDate);
    fd.append("reraNumber", formData.reraNumber);
    fd.append("isFeatured", formData.isFeatured);
    fd.append("isActive", formData.isActive);
    fd.append("displayOrder", formData.displayOrder);

    // Append array lists as stringified JSON strings
    fd.append("contactNumbers", JSON.stringify(contactNumbers.map((c) => c.trim()).filter(Boolean)));
    fd.append("amenities", JSON.stringify(amenities.map((a) => a.trim()).filter(Boolean)));

    // Append saleableArea as JSON
    if (minSqFt !== null) {
      fd.append("saleableArea", JSON.stringify({
        minSqFt,
        maxSqFt: maxSqFt !== null ? maxSqFt : null,
      }));
    }

    // Cover image file (new upload or existing cover metadata)
    if (coverImageFile) {
      fd.append("coverImage", coverImageFile);
    } else {
      fd.append("coverImage", JSON.stringify(formData.coverImage));
    }

    // Brochure file (new upload or existing brochure metadata)
    if (brochureFile) {
      fd.append("brochure", brochureFile);
    } else {
      fd.append("brochure", JSON.stringify(formData.brochure));
    }

    // Split gallery files out into uploads and remaining metadata list
    const existingGallery = [];
    formData.gallery.forEach((item) => {
      if (item.file) {
        fd.append("gallery", item.file);
      } else {
        existingGallery.push({ url: item.url, publicId: item.publicId });
      }
    });
    fd.append("existingGallery", JSON.stringify(existingGallery));

    try {
      if (isEditMode) {
        await api.patch(`/admin/projects/${id}`, fd);
        toast.success("Project updated successfully");
      } else {
        await api.post("/admin/projects", fd);
        toast.success("Project listed successfully");
      }
      navigate(`${ADMIN_SLUG}/projects`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save project listing details.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 bg-white border border-amber-100/60 rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
      </div>
    );
  }

  return (
    <div className="text-left flex flex-col gap-6">
      {/* Header back */}
      <div className="flex items-center justify-between border-b border-amber-100 pb-4">
        <button
          onClick={() => navigate(`${ADMIN_SLUG}/projects`)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#6B625A] hover:text-[#2E2A26] transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
        <h2 className="text-sm font-bold text-[#2E2A26] uppercase tracking-wider">
          {isEditMode ? "Edit Project Details" : "Add Inventory Listing"}
        </h2>
      </div>

      <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core fields (2/3 width) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
              Primary Specifications
            </h3>

            {/* Title & Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Shreeji Aaditya"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26] font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="e.g. shreeji-aaditya"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
                />
              </div>
            </div>

            {/* Type & Configuration & Starting Price */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Project Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm font-semibold cursor-pointer"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential + Commercial">Residential + Commercial</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Unit Configuration
                </label>
                <input
                  type="text"
                  value={formData.configuration}
                  onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                  placeholder="e.g. 2 & 3 BHK Apartments"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Starting Price Hint
                </label>
                <input
                  type="text"
                  value={formData.startingPrice}
                  onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                  placeholder="e.g. ₹31.20 Lakh onwards"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm font-semibold text-[#E8871E]"
                />
              </div>
            </div>

            {/* Location & Possession Date & RERA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Location Locality *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Plot No 12, Jewels Circle, Bhavnagar"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Possession Date
                </label>
                <input
                  type="text"
                  value={formData.possessionDate}
                  onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
                  placeholder="e.g. Dec 2026"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
                />
              </div>
            </div>

            {/* Description details */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Detailed Description *
              </label>
              <textarea
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Marketing details, structural details, area measurements, and build features..."
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-sm resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Saleable Area Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
              Saleable Area (SB Area)
            </h3>
            <p className="text-[10px] text-[#6B625A]">
              Enter the carpet / super built-up area per unit. Provide both Min &amp; Max for a range (e.g. 1336–1655 sq.ft), or only Min for a fixed size (e.g. 1060 sq.ft for Aaditya Skyline).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Min Sq.Ft
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.saleableArea.minSqFt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saleableArea: { ...formData.saleableArea, minSqFt: e.target.value },
                    })
                  }
                  placeholder="e.g. 1060"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Max Sq.Ft <span className="font-normal normal-case text-[9px]">(leave blank if single fixed area)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.saleableArea.maxSqFt}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      saleableArea: { ...formData.saleableArea, maxSqFt: e.target.value },
                    })
                  }
                  placeholder="e.g. 1655"
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Additional Photos Gallery Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
              Media & Project Gallery
            </h3>
            <ImageUpload
              label="Select Multi-Photo Attachments (Gallery)"
              isMultiple={true}
              galleryValues={formData.gallery}
              onGalleryChange={(updatedGallery) => setFormData({ ...formData, gallery: updatedGallery })}
            />
          </div>

          {/* Brochure PDF File Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
              Project Brochure (PDF)
            </h3>
            <p className="text-[10px] text-[#6B625A]">
              Upload a PDF document. If a brochure is already uploaded, a link will be shown below.
            </p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setBrochureFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-[#6B625A] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-[#E8871E] hover:file:bg-amber-100/50 cursor-pointer"
            />
            {brochureFile && (
              <p className="text-xs text-[#E8871E] font-semibold">
                Selected new file: {brochureFile.name}
              </p>
            )}
            {!brochureFile && formData.brochure?.url && (
              <div className="text-xs text-[#6B625A] flex items-center gap-2">
                <span>Current Brochure:</span>
                <a
                  href={formData.brochure.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8871E] font-bold hover:underline"
                >
                  Download / View PDF
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Action controllers sidebar */}
        <div className="flex flex-col gap-6">
          {/* Save Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary justify-center text-xs py-3.5 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <FiSave className="w-4 h-4" /> {saving ? "Saving Listing..." : "Save Project Listing"}
            </button>
            <button
              type="button"
              onClick={() => navigate(`${ADMIN_SLUG}/projects`)}
              className="w-full py-3 px-4 text-xs font-bold rounded-xl border border-amber-200 text-[#6B625A] hover:bg-amber-50/20 transition-all text-center"
            >
              Cancel & Exit
            </button>
          </div>

          {/* Visibility / Ordering Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
              Visibility & Order
            </h3>

            {/* Status Option */}
            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Construction Phase Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-150 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs font-bold text-[#E8871E] cursor-pointer"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Display Priority Order (Lower First)
              </label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            {/* RERA Number */}
            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                RERA Registration ID
              </label>
              <input
                type="text"
                value={formData.reraNumber}
                onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                placeholder="e.g. GJ/BHV/APP/..."
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            {/* Featured toggle */}
            <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded border-amber-300 text-[#F5A623] focus:ring-[#F5A623]"
              />
              <div>
                <span className="font-bold text-[#2E2A26] block">Featured Listing</span>
                <span className="text-[9px] text-[#6B625A]/70 block mt-0.5">
                  Pin to the homepage featured ventures.
                </span>
              </div>
            </label>

            {/* Active Toggle */}
            <label className="flex items-center gap-3 py-2 border-t border-amber-50 pt-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-amber-300 text-[#F5A623] focus:ring-[#F5A623]"
              />
              <div>
                <span className="font-bold text-[#2E2A26] block">Publish Immediately</span>
                <span className="text-[9px] text-[#6B625A]/70 block mt-0.5">
                  Make listing discoverable on public pages.
                </span>
              </div>
            </label>
          </div>

          {/* Cover Photo upload widget */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
            <ImageUpload
              label="Primary Listing Cover"
              value={formData.coverImage?.url}
              onChange={(file, previewUrl) => {
                setCoverImageFile(file);
                setFormData((prev) => ({ ...prev, coverImage: { url: previewUrl, publicId: prev.coverImage?.publicId || "" } }));
              }}
            />
          </div>

          {/* Contact Numbers Widget */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#2E2A26] uppercase tracking-wide border-b border-amber-50 pb-2">
              Listing Contact Lines
            </h4>
            <div className="flex flex-col gap-2">
              {contactNumbers.map((num, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => handleContactNumberChange(idx, e.target.value)}
                    placeholder="e.g. +91 99748 58500"
                    className="flex-grow px-3 py-1.5 rounded-lg border border-amber-100 focus:outline-none focus:border-[#F5A623] text-xs"
                  />
                  {contactNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContactNumber(idx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddContactNumber}
              className="text-[10px] font-bold text-[#E8871E] hover:text-[#F5A623] flex items-center gap-1 mt-1 justify-center py-1 border border-dashed border-amber-200 hover:border-amber-400 rounded-lg bg-amber-50/10 hover:bg-amber-50/35 transition-all"
            >
              <FiPlus /> Add Contact Number
            </button>
          </div>

          {/* Amenities tags dynamic widget */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#2E2A26] uppercase tracking-wide border-b border-amber-50 pb-2">
              Amenities & Perks
            </h4>

            {/* Tag add form */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g. Elevators"
                className="flex-grow px-3 py-1.5 rounded-lg border border-amber-100 focus:outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-[#E8871E] rounded-lg text-xs font-bold"
              >
                Add
              </button>
            </div>

            {/* Tag cloud layout */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {amenities.length === 0 ? (
                <span className="text-[10px] text-[#6B625A] italic">No amenities tags added.</span>
              ) : (
                amenities.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-[#E8871E] border border-amber-100"
                  >
                    <FiTag className="w-2.5 h-2.5" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(tag)}
                      className="hover:text-red-500 font-extrabold"
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
