import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import ImageUpload from "../components/ImageUpload.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import toast from "react-hot-toast";
import { FiTrash2, FiEdit2 } from "react-icons/fi";

/**
 * AdminTeam Component
 * Manages corporate staff directories.
 */
export default function AdminTeam() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form Fields
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [bio, setBio] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [photo, setPhoto] = useState({ url: "", publicId: "" });
  const [isActive, setIsActive] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);

  // Deletion State
  const [selectedId, setSelectedId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/team");
      if (data.success) setTeam(data.data);
    } catch {
      toast.error("Failed to load team list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleOpenCreate = () => {
    setEditingMember(null);
    setName("");
    setDesignation("");
    setBio("");
    setDisplayOrder(0);
    setPhoto({ url: "", publicId: "" });
    setIsActive(true);
    setPhotoFile(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMember(m);
    setName(m.name || "");
    setDesignation(m.designation || "");
    setBio(m.bio || "");
    setDisplayOrder(m.displayOrder || 0);
    setPhoto(m.photo || { url: "", publicId: "" });
    setIsActive(m.isActive !== undefined ? m.isActive : true);
    setPhotoFile(null);
    setFormOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Full name is required");
    if (!designation.trim()) return toast.error("Designation is required");

    const fd = new FormData();
    fd.append("name", name);
    fd.append("designation", designation);
    fd.append("bio", bio);
    fd.append("displayOrder", displayOrder);
    fd.append("isActive", isActive);

    if (photoFile) {
      fd.append("photo", photoFile);
    } else {
      fd.append("photo", JSON.stringify(photo));
    }

    try {
      if (editingMember) {
        await api.patch(`/admin/team/${editingMember._id}`, fd);
        toast.success("Team member details updated");
      } else {
        await api.post("/admin/team", fd);
        toast.success("Team member added successfully");
      }
      setFormOpen(false);
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save team member details");
    }
  };

  const handleDeletePrompt = (id) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/team/${selectedId}`);
      if (data.success) {
        toast.success("Team member profile soft-deleted");
        loadTeam();
      }
    } catch {
      toast.error("Failed to delete team member.");
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
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Team Directory</h2>
          <p className="text-xs text-[#6B625A] mt-1">Manage corporate staff details and profiles.</p>
        </div>
        <button
          onClick={formOpen ? () => setFormOpen(false) : handleOpenCreate}
          className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-4 shadow-sm"
        >
          {formOpen ? "View List" : "Add Member"}
        </button>
      </div>

      {formOpen ? (
        /* Create / Edit Form View */
        <form
          onSubmit={handleFormSubmit}
          className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 max-w-2xl"
        >
          <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2">
            {editingMember ? "Edit Team Member Details" : "Add New Team Profile"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Parth Parmar"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26] font-bold"
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Designation *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Co-Founder & Partner"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26] font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Order */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Display Order Priority
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold text-xs"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center h-10 mt-6">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded border-amber-300 text-[#F5A623]"
                />
                <span>Active Profile (Publish Publicly)</span>
              </label>
            </div>
          </div>

          {/* Bio Description */}
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
              Bio / Executive Summary
            </label>
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief summary of professional experience, qualifications, and background..."
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
            />
          </div>

          {/* Photo upload */}
          <div>
            <ImageUpload
              label="Staff Portrait Image (Upload)"
              value={photo?.url}
              onChange={(file, previewUrl) => {
                setPhotoFile(file);
                setPhoto((prev) => ({ ...prev, url: previewUrl }));
              }}
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-amber-50">
            <button type="submit" className="btn-primary py-2.5 px-5 text-xs">
              Save Member
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
        /* Team Directory Card List view */
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-20 bg-white border border-amber-100 rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
            </div>
          ) : team.length === 0 ? (
            <div className="text-center py-20 bg-white border border-amber-100 rounded-2xl text-xs text-[#6B625A] italic">
              No team members listed yet. Add new profiles above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {team.map((member) => (
                <div
                  key={member._id}
                  className={`bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative ${
                    !member.isActive ? "opacity-60 bg-gray-50/30" : ""
                  }`}
                >
                  {/* Portrait circle */}
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-amber-150 bg-amber-50 mb-4 shrink-0 shadow-sm relative group">
                    {member.photo?.url ? (
                      <img
                        src={member.photo.url}
                        alt={member.name}
                        className="w-full h-full object-cover animate-fade-in"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-amber-100/50 text-xs text-[#6B625A] font-extrabold uppercase">
                        Staff
                      </div>
                    )}
                  </div>

                  <h4 className="font-extrabold text-sm text-[#2E2A26]">{member.name}</h4>
                  <span className="text-[10px] font-bold text-[#E8871E] uppercase mt-1 mb-2 tracking-wider">
                    {member.designation}
                  </span>
                  <p className="text-xs text-[#6B625A] line-clamp-3 leading-relaxed mb-4">
                    {member.bio || "No professional executive bio listed yet."}
                  </p>

                  <div className="w-full flex justify-between items-center pt-3 border-t border-amber-50 mt-auto text-xs font-semibold">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        member.isActive
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {member.isActive ? "Active" : "Hidden"}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(member)}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-[#E8871E] rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePrompt(member._id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        title="Deactivate / Soft-Delete Member"
                      >
                        <FiTrash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal before deleting */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Team Member"
        message="Are you sure you want to deactivate (soft-delete) this team member profile? It will be hidden from public portfolio lists immediately."
        isLoading={deleting}
      />
    </div>
  );
}
