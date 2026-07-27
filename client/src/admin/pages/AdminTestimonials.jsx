import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import ImageUpload from "../components/ImageUpload.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import toast from "react-hot-toast";
import { FiTrash2, FiEdit2, FiStar, FiCheck, FiCheckCircle } from "react-icons/fi";

/**
 * AdminTestimonials Component
 * Moderates buyer reviews and handles testimonials.
 */
export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [isApproved, setIsApproved] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [customerPhoto, setCustomerPhoto] = useState({ url: "", publicId: "" });
  const [photoFile, setPhotoFile] = useState(null);

  // Delete State
  const [selectedId, setSelectedId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const [testRes, projRes] = await Promise.all([
        api.get("/admin/testimonials"),
        api.get("/admin/projects"),
      ]);
      if (testRes.data?.success) setTestimonials(testRes.data.data);
      if (projRes.data?.success) setProjects(projRes.data.data);
    } catch {
      toast.error("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleOpenCreate = () => {
    setEditingTestimonial(null);
    setCustomerName("");
    setProjectName("");
    setRating(5);
    setMessage("");
    setIsApproved(true);
    setIsFeatured(false);
    setCustomerPhoto({ url: "", publicId: "" });
    setPhotoFile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTestimonial(t);
    setCustomerName(t.customerName || "");
    setProjectName(t.projectName || "");
    setRating(t.rating || 5);
    setMessage(t.message || "");
    setIsApproved(!!t.isApproved);
    setIsFeatured(!!t.isFeatured);
    setCustomerPhoto(t.customerPhoto || { url: "", publicId: "" });
    setPhotoFile(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Customer name is required");
    if (!message.trim()) return toast.error("Review message is required");

    const fd = new FormData();
    fd.append("customerName", customerName);
    fd.append("projectName", projectName || "");
    fd.append("rating", rating);
    fd.append("message", message);
    fd.append("isApproved", isApproved);
    fd.append("isFeatured", isFeatured);

    if (photoFile) {
      fd.append("customerPhoto", photoFile);
    } else {
      fd.append("customerPhoto", JSON.stringify(customerPhoto));
    }

    try {
      if (editingTestimonial) {
        await api.patch(`/admin/testimonials/${editingTestimonial._id}`, fd);
        toast.success("Testimonial updated successfully");
      } else {
        await api.post("/admin/testimonials", fd);
        toast.success("Testimonial created successfully");
      }
      setFormOpen(false);
      loadTestimonials();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save testimonial");
    }
  };

  const handleQuickApproveToggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/testimonials/${id}/approve`);
      if (data.success) {
        toast.success("Approval status updated");
        loadTestimonials();
      }
    } catch {
      toast.error("Failed to update approval status.");
    }
  };

  const handleQuickFeatureToggle = async (id) => {
    try {
      const { data } = await api.patch(`/admin/testimonials/${id}/feature`);
      if (data.success) {
        toast.success("Featured status updated");
        loadTestimonials();
      }
    } catch {
      toast.error("Failed to toggle featured state.");
    }
  };

  const handleDeletePrompt = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/testimonials/${selectedId}`);
      if (data.success) {
        toast.success("Testimonial deleted successfully");
        loadTestimonials();
      }
    } catch {
      toast.error("Failed to delete testimonial.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="text-left flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Testimonials</h2>
          <p className="text-xs text-[#6B625A] mt-1">Review and moderate client feedback and social proof.</p>
        </div>
        <button
          onClick={formOpen ? () => setFormOpen(false) : handleOpenCreate}
          className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-4 shadow-sm"
        >
          {formOpen ? "View List" : "Add Testimonial"}
        </button>
      </div>

      {formOpen ? (
        /* Edit / Create Form View */
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 max-w-2xl"
        >
          <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
            {editingTestimonial ? "Edit Testimonial Details" : "Add New Client Review"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Parth Parmar"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26] font-bold"
              />
            </div>

            {/* Related Project Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Project Name Reference (Optional)
              </label>
              <select
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26] font-semibold cursor-pointer"
              >
                <option value="">None (Generic)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p.title}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Star Rating Select */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Star Rating
              </label>
              <div className="flex gap-2 items-center h-10 px-4 rounded-xl border border-amber-100 bg-[#FFFBF5]/20">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const starVal = idx + 1;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRating(starVal)}
                      className={`text-lg transition-colors ${
                        starVal <= rating ? "text-[#F5A623]" : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility checks */}
            <div className="flex items-center gap-6 h-10">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isApproved}
                  onChange={(e) => setIsApproved(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-[#F5A623]"
                />
                <span>Approve Review</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-[#F5A623]"
                />
                <span>Featured Review</span>
              </label>
            </div>
          </div>

          {/* Feedback message */}
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
              Review Testimonial Message *
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Aditya Builders did a wonderful job with our flat construction..."
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
            />
          </div>

          {/* Staff Photo */}
          <div>
            <ImageUpload
              label="Customer Profile Image Upload (Optional)"
              value={customerPhoto?.url}
              onChange={(file, previewUrl) => {
                setPhotoFile(file);
                setCustomerPhoto((prev) => ({ ...prev, url: previewUrl }));
              }}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-amber-50">
            <button type="submit" className="btn-primary py-2.5 px-5 text-xs">
              Save Review
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="py-2.5 px-5 text-xs font-bold border border-amber-200 hover:bg-amber-50/20 text-[#6B625A] rounded-xl transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* Moderator List Grid View */
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-20 bg-white border border-amber-100 rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-20 bg-white border border-amber-100 rounded-2xl text-xs text-[#6B625A] italic">
              No testimonials found. Add new feedback items above.
            </div>
          ) : (
            testimonials.map((t) => (
              <div
                key={t._id}
                className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex gap-4 items-start text-left">
                  {/* Customer Image */}
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-150 bg-amber-50 shrink-0 shadow-sm mt-0.5">
                    {t.customerPhoto?.url ? (
                      <img
                        src={t.customerPhoto.url}
                        alt={t.customerName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-100/50 text-[10px] text-[#6B625A] font-extrabold uppercase">
                        AB
                      </div>
                    )}
                  </div>

                  <div>
                    {/* Stars and customer name details */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-[#2E2A26]">{t.customerName}</h4>
                      {t.projectName && (
                        <span className="text-[10px] bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-[#E8871E] font-bold">
                          Flat Owner in {t.projectName}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-[#F5A623] ml-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <FiStar
                            key={idx}
                            className={`w-3.5 h-3.5 ${
                              idx < t.rating ? "fill-[#F5A623]" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#6B625A] italic leading-relaxed">
                      "{t.message}"
                    </p>
                  </div>
                </div>

                {/* Testimonial Action Column */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {/* Approval Toggle */}
                  <button
                    onClick={() => handleQuickApproveToggle(t._id)}
                    className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                      t.isApproved
                        ? "bg-green-50 text-green-600 border-green-200"
                        : "bg-amber-50 text-[#E8871E] border-amber-200"
                    }`}
                  >
                    {t.isApproved ? (
                      <>
                        <FiCheckCircle className="w-3.5 h-3.5" /> Approved
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-3.5 h-3.5" /> Set Approve
                      </>
                    )}
                  </button>

                  {/* Featured Toggle */}
                  <button
                    onClick={() => handleQuickFeatureToggle(t._id)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      t.isFeatured
                        ? "bg-amber-100/50 text-[#E8871E] border-amber-200"
                        : "text-gray-400 border-gray-250 hover:bg-amber-50/20 hover:text-[#E8871E]"
                    }`}
                    title="Featured Status Toggle"
                  >
                    <FiStar className={`w-4 h-4 ${t.isFeatured ? "fill-[#E8871E]" : ""}`} />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1.5 bg-amber-50 hover:bg-amber-100 text-[#E8871E] rounded-lg transition-colors"
                    title="Edit Review Details"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeletePrompt(t._id)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Permanently Delete Review"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation modal before deleting */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Testimonial"
        message="Are you sure you want to permanently delete this client review from the database? This action is destructive and cannot be undone."
        isLoading={deleting}
      />
    </div>
  );
}
