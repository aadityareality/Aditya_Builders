import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import toast from "react-hot-toast";
import { FiTrash2, FiMail, FiUserPlus, FiShield } from "react-icons/fi";

/**
 * AdminUsers Component
 * Superadmin exclusive interface to register and modify administrators and permissions.
 */
export default function AdminUsers() {
  const { admin: currentAdmin } = useAdminAuth();

  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Registration form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("editor");
  const [saving, setSaving] = useState(false);

  // Deletion prompt state
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/admins");
      if (data.success && data.data) {
        setAdmins(data.data);
      }
    } catch {
      toast.error("Failed to load administrator accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleRegisterAdmin = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Full name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");

    setSaving(true);
    try {
      const { data } = await api.post("/admin/admins", {
        name,
        email,
        password,
        role,
      });
      if (data.success) {
        toast.success(`Admin account created for ${name}`);
        setFormOpen(false);
        setName("");
        setEmail("");
        setPassword("");
        setRole("editor");
        loadAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRoleToggle = async (id, currentRole) => {
    // Basic verification: preventing lockouts
    if (id === currentAdmin.id && currentRole === "superadmin") {
      toast.error("You cannot demote yourself. Promote another superadmin first.");
      return;
    }

    const nextRole = currentRole === "superadmin" ? "editor" : "superadmin";

    // Prevent demoting the last superadmin
    if (currentRole === "superadmin") {
      const superCount = admins.filter((a) => a.role === "superadmin").length;
      if (superCount <= 1) {
        toast.error("Cannot demote the last remaining superadmin.");
        return;
      }
    }

    try {
      const { data } = await api.patch(`/admin/admins/${id}`, { role: nextRole });
      if (data.success) {
        toast.success(`Role updated to ${nextRole}`);
        loadAdmins();
      }
    } catch {
      toast.error("Failed to update role permissions.");
    }
  };

  const handleDeletePrompt = (id) => {
    // Prevent self deletion
    if (id === currentAdmin.id) {
      toast.error("You cannot delete your own active admin account.");
      return;
    }

    // Prevent deleting the last superadmin
    const target = admins.find((a) => a._id === id);
    if (target?.role === "superadmin") {
      const superCount = admins.filter((a) => a.role === "superadmin").length;
      if (superCount <= 1) {
        toast.error("Cannot delete the last superadmin account — promotion required.");
        return;
      }
    }

    setSelectedAdminId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { data } = await api.delete(`/admin/admins/${selectedAdminId}`);
      if (data.success) {
        toast.success("Administrator account deleted successfully");
        loadAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete admin profile.");
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setSelectedAdminId(null);
    }
  };

  return (
    <div className="text-left flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Admins Management</h2>
          <p className="text-xs text-[#6B625A] mt-1">Superadmin exclusive: Register portal users and alter access roles.</p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="btn-primary flex items-center gap-1.5 text-xs py-2.5 px-4 shadow-sm"
        >
          {formOpen ? "View Administrators" : "Add Administrator"}
        </button>
      </div>

      {formOpen ? (
        /* Create Admin Form */
        <form
          onSubmit={handleRegisterAdmin}
          className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 max-w-md"
        >
          <h3 className="text-sm font-bold text-[#2E2A26] border-b border-amber-50 pb-2 flex items-center gap-1.5">
            <FiUserPlus /> Register New Account
          </h3>

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

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
              Corporate Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parth@adityabuilders.in"
              className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
              Portal Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
            />
          </div>

          {/* Role select dropdown */}
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
              System Permission Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26] font-semibold cursor-pointer"
            >
              <option value="editor">Editor (Read-Write content, No user administration)</option>
              <option value="superadmin">Superadmin (All privileges & database management)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-3 border-t border-amber-50">
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-5 text-xs">
              {saving ? "Registering..." : "Create Account"}
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
        /* Admins list grid view */
        <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-amber-50/40 border-b border-amber-100 text-[#6B625A] font-bold text-xs uppercase tracking-wider select-none">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role Permission</th>
                  <th className="p-4 text-center">Toggle Role</th>
                  <th className="p-4 text-right">Delete Account</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((item) => {
                  const isSelf = item._id === currentAdmin.id;
                  return (
                    <tr
                      key={item._id}
                      className="border-b border-amber-50/50 hover:bg-[#FFFBF5]/20 transition-all font-medium text-xs"
                    >
                      <td className="p-4 text-[#2E2A26] font-bold">
                        {item.name}{" "}
                        {isSelf && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-[#E8871E] text-[8px] font-extrabold uppercase">
                            You
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-[#6B625A] flex items-center gap-1.5 mt-0.5">
                        <FiMail /> {item.email}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            item.role === "superadmin"
                              ? "bg-amber-100 text-[#E8871E]"
                              : "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleRoleToggle(item._id, item.role)}
                          disabled={isSelf}
                          className="px-3 py-1 rounded-lg border border-amber-250 bg-amber-50/20 text-[#E8871E] hover:bg-amber-50 transition-colors disabled:opacity-40 disabled:pointer-events-none text-[10px] font-bold"
                        >
                          <FiShield className="inline w-3 h-3 mr-1" /> Toggle Role
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeletePrompt(item._id)}
                          disabled={isSelf}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-40 disabled:pointer-events-none"
                          title="Delete Account"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirmation modal before deleting */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Administrator Account"
        message="Are you sure you want to permanently delete this administrator profile? This action will revoke all portal access and cannot be undone."
        isLoading={deleting}
      />
    </div>
  );
}
