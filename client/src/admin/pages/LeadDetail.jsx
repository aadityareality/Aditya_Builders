import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../hooks/api.js";
import ConfirmModal from "../components/ConfirmModal.jsx";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiClock,
  FiLayers,
  FiTrash2,
  FiSave,
  FiMaximize2,
  FiX,
} from "react-icons/fi";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

/**
 * LeadDetail Component
 * Detailed view of a customer lead. Handles status updates, internal notes,
 * attachment lightbox, and deletion prompts.
 */
export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Notes and Status states
  const [status, setStatus] = useState("New");
  const [internalNotes, setInternalNotes] = useState("");

  // Lightbox overlay state
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Deletion modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLeadDetails = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/inquiries/${id}`);
      if (data.success && data.data) {
        setLead(data.data);
        setStatus(data.data.status || "New");
        setInternalNotes(data.data.internalNotes || "");
      }
    } catch {
      toast.error("Could not fetch lead details.");
      navigate(`${ADMIN_SLUG}/leads`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/inquiries/${id}/status`, {
        status,
        internalNotes,
      });
      if (data.success) {
        toast.success("Lead details updated successfully");
        setLead(data.data);
      }
    } catch {
      toast.error("Failed to update lead settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/inquiries/${id}`);
      if (data.success) {
        toast.success("Inquiry deleted successfully");
        navigate(`${ADMIN_SLUG}/leads`, { replace: true });
      }
    } catch {
      toast.error("Deletion failed.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 bg-white border border-amber-100/60 rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
      </div>
    );
  }

  if (!lead) return null;

  const dateStr = new Date(lead.createdAt).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="text-left flex flex-col gap-6">
      {/* Back Header Nav */}
      <div className="flex items-center justify-between border-b border-amber-100 pb-4">
        <button
          onClick={() => navigate(`${ADMIN_SLUG}/leads`)}
          className="flex items-center gap-1.5 text-xs font-bold text-[#6B625A] hover:text-[#2E2A26] transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" /> Back to Leads
        </button>

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:bg-red-50 py-1.5 px-3 rounded-lg transition-colors border border-transparent hover:border-red-100"
        >
          <FiTrash2 className="w-4 h-4" /> Delete Submission
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Content Info (2 spans) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div>
              <span className="text-[10px] font-bold text-[#F5A623] uppercase tracking-widest">
                Lead Detail Profile
              </span>
              <h2 className="text-xl font-bold font-display text-[#2E2A26] mt-0.5">{lead.name}</h2>
            </div>

            {/* Communication channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-amber-100/50 hover:bg-amber-50/20 text-[#6B625A] hover:text-[#2E2A26] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#E8871E]">
                  <FiPhone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] text-[#6B625A]/60 block font-bold uppercase">Phone</span>
                  <span className="font-semibold block mt-0.5">{lead.phone}</span>
                </div>
              </a>

              <a
                href={`mailto:${lead.email}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-amber-100/50 hover:bg-amber-50/20 text-[#6B625A] hover:text-[#2E2A26] transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[#E8871E]">
                  <FiMail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[9px] text-[#6B625A]/60 block font-bold uppercase">Email</span>
                  <span className="font-semibold block mt-0.5 truncate">{lead.email}</span>
                </div>
              </a>
            </div>

            {/* Message block */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#6B625A] uppercase tracking-wider">
                Submission Message
              </span>
              <div className="bg-[#FFFBF5] border border-amber-100/70 p-4 rounded-xl text-xs text-[#6B625A] leading-relaxed">
                {lead.subject && (
                  <p className="font-bold text-[#E8871E] mb-2 text-sm">{lead.subject}</p>
                )}
                <p className="whitespace-pre-wrap italic">"{lead.message}"</p>
              </div>
            </div>

            {/* Property interest references */}
            {lead.interestedProject && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#6B625A] uppercase tracking-wider">
                  Product/Project Interest
                </span>
                <Link
                  to={`${ADMIN_SLUG}/projects/${lead.interestedProject._id}/edit`}
                  className="flex items-center justify-between p-3.5 bg-amber-50/20 hover:bg-amber-50/55 border border-amber-100 rounded-xl transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-[#E8871E]" />
                    <span className="font-bold text-[#2E2A26]">{lead.interestedProject.title}</span>
                  </div>
                  <span className="text-[#E8871E] font-bold hover:underline">
                    Edit Listing →
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {lead.attachments && lead.attachments.length > 0 && (
            <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-bold text-[#2E2A26]">Photo Attachments ({lead.attachments.length})</h3>
              <p className="text-[10px] text-[#6B625A] -mt-2">Photos submitted by the user (site, layout plans, plots, reference designs).</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {lead.attachments.map((photo, index) => (
                  <div
                    key={photo._id || index}
                    onClick={() => setSelectedPhoto(photo.url)}
                    className="relative aspect-square rounded-xl overflow-hidden border border-amber-100 bg-amber-50 shrink-0 cursor-pointer group shadow-sm"
                  >
                    <img src={photo.url} alt="Attachment" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-150">
                      <FiMaximize2 className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Workflow Control (1 span) */}
        <div className="flex flex-col gap-6">
          {/* Metadata Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm text-xs flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[#6B625A]">
              <FiClock className="shrink-0" />
              <span>Received {dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6B625A]">
              <span className="font-bold">Source:</span>
              <span>{lead.source || "Website Contact Form"}</span>
            </div>
            {lead.utmSource && (
              <div className="flex items-center gap-2 text-[#6B625A] mt-1 flex-wrap">
                <span className="font-bold">UTM Source:</span>
                <span className="bg-amber-50 px-2 py-0.5 border border-amber-100 rounded text-[#E8871E] font-semibold">{lead.utmSource}</span>
              </div>
            )}
            {lead.utmMedium && (
              <div className="flex items-center gap-2 text-[#6B625A] flex-wrap">
                <span className="font-bold">UTM Medium:</span>
                <span className="bg-amber-50 px-2 py-0.5 border border-amber-100 rounded text-[#E8871E] font-semibold">{lead.utmMedium}</span>
              </div>
            )}
            {lead.utmCampaign && (
              <div className="flex items-center gap-2 text-[#6B625A] flex-wrap">
                <span className="font-bold">UTM Campaign:</span>
                <span className="bg-amber-50 px-2 py-0.5 border border-amber-100 rounded text-[#E8871E] font-semibold">{lead.utmCampaign}</span>
              </div>
            )}
          </div>

          {/* Update Workflow Form */}
          <form
            onSubmit={handleSaveDetails}
            className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4"
          >
            <h3 className="text-sm font-bold text-[#2E2A26]">Lead Triage</h3>

            {/* Status Option dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-150 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs font-bold text-[#E8871E] cursor-pointer"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted (In Progress)</option>
                <option value="Closed">Closed (Resolved)</option>
              </select>
            </div>

            {/* Notes content text area */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Internal Sales Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Called back on Monday. Customer interested in 2 BHK flat layout details..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full btn-primary justify-center text-xs py-3.5 mt-2 flex items-center gap-1.5"
            >
              <FiSave /> {saving ? "Saving Notes..." : "Save Leads Status"}
            </button>
          </form>
        </div>
      </div>

      {/* Confirmation modal before deleting */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Inquiry Submission"
        message="Are you sure you want to permanently delete this lead from the inbox database? This action cannot be undone."
        confirmText="Permanently Delete"
        isLoading={deleting}
      />

      {/* Lightbox attachment portal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 bg-black/85 backdrop-blur-xs"
          />

          <div className="relative max-w-4xl w-full h-full max-h-[85vh] flex items-center justify-center z-10">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#F5A623] text-xl p-2 focus:outline-none"
            >
              <FiX className="w-8 h-8" />
            </button>

            {/* Image Preview container */}
            <img
              src={selectedPhoto}
              alt="Lightbox Attachment View"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
