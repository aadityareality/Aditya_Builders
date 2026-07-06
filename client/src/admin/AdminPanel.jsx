import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../hooks/api.js";
import {
  FiLock,
  FiLogOut,
  FiHome,
  FiLayers,
  FiImage,
  FiMessageSquare,
  FiMail,
  FiUsers,
  FiSettings,
  FiKey,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiCheck,
  FiCheckCircle,
  FiFolderPlus,
  FiStar,
} from "react-icons/fi";
import toast from "react-hot-toast";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: IMAGE UPLOAD FIELD (CLOUDINARY)
// ─────────────────────────────────────────────────────────────────────────────
function ImageUploadField({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/admin/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        onChange(data.url, data.publicId);
        toast.success("Image uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "File upload failed");
    } finally {
      setUploadingState(false);
    }
  };

  // Helper hook state manager wrapper
  const setUploadingState = (state) => {
    setUploading(state);
  };

  return (
    <div className="flex flex-col gap-2 text-left">
      <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider">{label}</label>
      <div className="flex items-center gap-4 bg-[#FFFBF5]/20 p-3 rounded-xl border border-amber-100/50">
        {value ? (
          <div className="w-16 h-16 rounded-lg overflow-hidden border border-amber-100 bg-amber-50 shrink-0 shadow-sm">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-lg border-2 border-dashed border-amber-200 bg-amber-50/20 shrink-0 flex items-center justify-center text-xs text-[#6B625A]/50">
            No Image
          </div>
        )}
        <div className="flex-grow flex flex-col gap-1.5">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="text-xs text-[#6B625A] file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-[#E8871E] hover:file:bg-amber-100 cursor-pointer"
          />
          {uploading ? (
            <span className="text-[10px] text-[#F5A623] font-bold animate-pulse">Uploading file...</span>
          ) : (
            <span className="text-[9px] text-[#6B625A]/60">Supports JPG, PNG, WEBP (Max 5MB)</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADMIN PANEL WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { admin, loading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    const res = await login(email, password);
    setLoggingIn(false);
    if (res.success) {
      setEmail("");
      setPassword("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFBF5]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#F5A623]"></div>
      </div>
    );
  }

  // ─── Render Login Form ─────────────────────────────────────────────────────
  if (!admin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FFFBF5] px-4">
        <div className="bg-white border border-amber-100 rounded-2xl p-8 shadow-card w-full max-w-md text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#F5A623] flex items-center justify-center text-white text-lg shadow-sm">
              <FiLock />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-[#2E2A26] leading-none">
                Admin Area
              </h1>
              <p className="text-xs text-[#6B625A] mt-1">Sign in to Aditya Builders CMS</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@adityabuilders.in"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full btn-primary justify-center text-sm py-3.5 mt-2"
            >
              {loggingIn ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ─── Render Logged-In Dashboard ───────────────────────────────────────────
  const tabs = [
    { id: "dashboard",    name: "Dashboard",       icon: <FiHome /> },
    { id: "projects",     name: "Projects",        icon: <FiLayers /> },
    { id: "gallery",      name: "Gallery",         icon: <FiImage /> },
    { id: "testimonials", name: "Testimonials",    icon: <FiMessageSquare /> },
    { id: "inquiries",    name: "Inquiries",       icon: <FiMail /> },
    { id: "team",         name: "Team",            icon: <FiUsers /> },
    { id: "settings",     name: "Site Settings",   icon: <FiSettings /> },
    { id: "password",     name: "Change Password", icon: <FiKey /> },
  ];

  return (
    <div className="min-h-screen flex bg-[#FFFBF5] text-[#2E2A26] font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#2E2A26] text-[#FFFBF5] flex flex-col shrink-0">
        <div className="p-6 border-b border-[#3D3732] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F5A623] to-[#E8871E] flex items-center justify-center text-white font-extrabold text-xs">
            AB
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block">Aditya CMS</span>
            <span className="text-[10px] text-amber-300 font-bold block mt-0.5 uppercase tracking-wide">
              {admin.role}
            </span>
          </div>
        </div>

        <nav className="flex-grow p-4 flex flex-col gap-1.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-[#F5A623] text-white shadow-md shadow-amber-500/10"
                    : "text-[#6B625A] hover:bg-[#3D3732] hover:text-white"
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#3D3732] flex flex-col gap-2">
          <div className="px-4 py-2 text-[10px] text-[#6B625A] leading-tight">
            Logged in: <span className="text-[#FFFBF5] block truncate mt-0.5">{admin.email}</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-800/20 text-red-400 hover:bg-red-800/35 rounded-xl text-xs font-bold transition-colors"
          >
            <FiLogOut /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content Grid */}
      <main className="flex-grow p-8 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard"    && <DashboardTab setActiveTab={setActiveTab} />}
          {activeTab === "projects"     && <ProjectsTab />}
          {activeTab === "gallery"      && <GalleryTab />}
          {activeTab === "testimonials" && <TestimonialsTab />}
          {activeTab === "inquiries"    && <InquiriesTab />}
          {activeTab === "team"         && <TeamTab />}
          {activeTab === "settings"     && <SettingsTab />}
          {activeTab === "password"     && <PasswordTab />}
        </div>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 1: DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
function DashboardTab({ setActiveTab }) {
  const [stats, setStats] = useState({ projects: 0, inquiries: 0, testimonials: 0 });
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [projRes, inqRes, testRes] = await Promise.all([
          api.get("/admin/projects"),
          api.get("/admin/inquiries?limit=5"),
          api.get("/admin/testimonials"),
        ]);
        setStats({
          projects: projRes.data?.total || 0,
          inquiries: inqRes.data?.total || 0,
          testimonials: testRes.data?.total || 0,
        });
        if (inqRes.data?.data) {
          setRecentInquiries(inqRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard stats load fail", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="text-center py-8">Loading dashboard analytics...</div>;

  return (
    <div className="text-left">
      <h2 className="text-2xl font-bold font-display text-[#2E2A26] mb-6">System Dashboard</h2>

      {/* Grid of counter cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#F5A623] text-xl">
            <FiLayers />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#2E2A26] block">{stats.projects}</span>
            <span className="text-xs font-semibold text-[#6B625A] uppercase tracking-wider">Total Projects</span>
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#F5A623] text-xl">
            <FiMail />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#2E2A26] block">{stats.inquiries}</span>
            <span className="text-xs font-semibold text-[#6B625A] uppercase tracking-wider">Contact Inquiries</span>
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-[#F5A623] text-xl">
            <FiMessageSquare />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-[#2E2A26] block">{stats.testimonials}</span>
            <span className="text-xs font-semibold text-[#6B625A] uppercase tracking-wider">Testimonials</span>
          </div>
        </div>
      </div>

      {/* Recent inquiries list */}
      <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold font-display text-[#2E2A26]">Recent Enquiries Inbox</h3>
          <button
            onClick={() => setActiveTab("inquiries")}
            className="text-xs font-bold text-[#F5A623] hover:underline"
          >
            View All
          </button>
        </div>

        {recentInquiries.length === 0 ? (
          <p className="text-xs text-[#6B625A]">Your inbox is empty.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {recentInquiries.map((inq) => (
              <div key={inq._id} className="p-4 rounded-xl bg-[#FFFBF5] border border-amber-50/50 flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-[#2E2A26] text-sm">{inq.name}</h4>
                  <p className="text-xs text-[#6B625A] mt-0.5">{inq.email} • {inq.phone}</p>
                  <p className="text-xs text-[#6B625A] mt-2 font-medium">"{inq.message}"</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  inq.status === "New"
                    ? "bg-amber-100 text-[#E8871E]"
                    : inq.status === "Contacted"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-green-100 text-green-600"
                }`}>
                  {inq.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 2: PROJECTS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function ProjectsTab() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState(null);
  const [formMode, setFormMode] = useState(false); // false for list, true for edit/create
  const [formData, setFormData] = useState({
    title: "",
    type: "Residential",
    configuration: "",
    status: "Ongoing",
    location: "",
    description: "",
    startingPrice: "",
    possessionDate: "",
    reraNumber: "",
    amenities: "",
    contactNumbers: "",
    coverImage: { url: "", publicId: "" },
  });

  const loadProjects = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/projects");
      if (data.success) setProjects(data.data);
    } catch {
      toast.error("Failed to load projects list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormData({
      title: "",
      type: "Residential",
      configuration: "",
      status: "Ongoing",
      location: "",
      description: "",
      startingPrice: "",
      possessionDate: "",
      reraNumber: "",
      amenities: "",
      contactNumbers: "",
      coverImage: { url: "", publicId: "" },
    });
    setFormMode(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProject(p);
    setFormData({
      title: p.title || "",
      type: p.type || "Residential",
      configuration: p.configuration || "",
      status: p.status || "Ongoing",
      location: p.location || "",
      description: p.description || "",
      startingPrice: p.startingPrice || "",
      possessionDate: p.possessionDate || "",
      reraNumber: p.reraNumber || "",
      amenities: p.amenities?.join(", ") || "",
      contactNumbers: p.contactNumbers?.join(", ") || "",
      coverImage: p.coverImage || { url: "", publicId: "" },
    });
    setFormMode(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      amenities: formData.amenities ? formData.amenities.split(",").map(i => i.trim()).filter(Boolean) : [],
      contactNumbers: formData.contactNumbers ? formData.contactNumbers.split(",").map(i => i.trim()).filter(Boolean) : [],
    };

    try {
      if (editingProject) {
        await api.patch(`/admin/projects/${editingProject._id}`, payload);
        toast.success("Project updated successfully");
      } else {
        await api.post("/admin/projects", payload);
        toast.success("Project created successfully");
      }
      setFormMode(false);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save project");
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate (soft-delete) this project?")) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      toast.success("Project deactivated");
      loadProjects();
    } catch {
      toast.error("Deactivation failed");
    }
  };

  const handleRestore = async (id) => {
    try {
      await api.patch(`/admin/projects/${id}/restore`);
      toast.success("Project restored to active");
      loadProjects();
    } catch {
      toast.error("Restoration failed");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await api.patch(`/admin/projects/${id}/feature`);
      toast.success("Featured state toggled");
      loadProjects();
    } catch {
      toast.error("Toggling featured failed");
    }
  };

  if (formMode) {
    return (
      <div className="text-left bg-white border border-amber-100 rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-bold font-display text-[#2E2A26] mb-6">
          {editingProject ? `Edit Project: ${editingProject.title}` : "Create New Project"}
        </h3>

        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Project Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Aaditya Skyline"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Project Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Residential + Commercial">Residential + Commercial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Configuration</label>
              <input
                type="text"
                value={formData.configuration}
                onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                placeholder="e.g. 2 BHK, 2/3 BHK"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Upcoming">Upcoming</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Starting Price</label>
              <input
                type="text"
                value={formData.startingPrice}
                onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                placeholder="e.g. ₹31.20 Lakh onwards"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Location</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Near Jewels Circle, Bhavnagar"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Possession Date</label>
              <input
                type="text"
                value={formData.possessionDate}
                onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })}
                placeholder="e.g. Dec 2026"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">RERA Number</label>
              <input
                type="text"
                value={formData.reraNumber}
                onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })}
                placeholder="e.g. GJ/BHV/..."
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Description</label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Marketing description details..."
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm resize-none"
            />
          </div>

          <div>
            <ImageUploadField
              label="Project Cover Image"
              value={formData.coverImage?.url}
              onChange={(url, publicId) => setFormData({ ...formData, coverImage: { url, publicId } })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Amenities (comma-separated)</label>
            <input
              type="text"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
              placeholder="Lift, CCTV Surveillance, Covered Parking, 24/7 Water"
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Contact Numbers (comma-separated)</label>
            <input
              type="text"
              value={formData.contactNumbers}
              onChange={(e) => setFormData({ ...formData, contactNumbers: e.target.value })}
              placeholder="+91 99748 58500, +91 99748 58501"
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>

          <div className="flex gap-4 mt-4">
            <button type="submit" className="btn-primary py-3.5 px-6">
              Save Project
            </button>
            <button
              type="button"
              onClick={() => setFormMode(false)}
              className="btn-outline py-3.5 px-6 border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="text-left">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Projects Dashboard</h2>
        <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-1.5 text-xs py-2.5">
          <FiPlus /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8 text-[#6B625A]">No projects created yet.</div>
      ) : (
        <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-amber-50/50 border-b border-amber-100 text-[#6B625A] font-bold text-xs uppercase tracking-wider">
                <th className="p-4">Title</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id} className="border-b border-amber-50 hover:bg-[#FFFBF5]/30">
                  <td className="p-4 font-semibold text-[#2E2A26]">{p.title}</td>
                  <td className="p-4 text-xs text-[#6B625A]">{p.type}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-[#E8871E] border border-amber-100">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleFeatured(p._id)}
                      className={`text-lg transition-colors ${
                        p.isFeatured ? "text-amber-400" : "text-gray-300 hover:text-amber-300"
                      }`}
                      title="Toggle Featured"
                    >
                      ★
                    </button>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      p.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      {p.isActive ? "Yes" : "Soft-Deleted"}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-[#E8871E] rounded-lg transition-colors"
                      title="Edit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    {p.isActive ? (
                      <button
                        onClick={() => handleDeactivate(p._id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title="Deactivate"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestore(p._id)}
                        className="p-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors text-xs font-bold"
                        title="Restore"
                      >
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 3: GALLERY MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function GalleryTab() {
  const [images, setImages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "Other",
    imageUrl: "",
    publicId: "",
    relatedProject: "",
  });

  const loadGallery = async () => {
    setLoading(true);
    try {
      const [galRes, projRes] = await Promise.all([
        api.get("/admin/gallery"),
        api.get("/admin/projects"),
      ]);
      if (galRes.data?.success) setImages(galRes.data.data);
      if (projRes.data?.success) setProjects(projRes.data.data);
    } catch {
      toast.error("Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) return toast.error("Image file is required");

    const payload = {
      title: formData.title,
      category: formData.category,
      image: {
        url: formData.imageUrl,
        publicId: formData.publicId || `manual/gallery-${Date.now()}`,
      },
      relatedProject: formData.relatedProject || null,
    };

    try {
      await api.post("/admin/gallery", payload);
      toast.success("Image added to gallery");
      setShowAddForm(false);
      setFormData({ title: "", category: "Other", imageUrl: "", publicId: "", relatedProject: "" });
      loadGallery();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add image");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate (soft-delete) this gallery image?")) return;
    try {
      await api.delete(`/admin/gallery/${id}`);
      toast.success("Image deactivated");
      loadGallery();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="text-left">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Gallery Dashboard</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
        >
          {showAddForm ? "View Grid" : "Add Image"}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 mb-8">
          <h3 className="text-lg font-bold font-display text-[#2E2A26]">Add Gallery Image</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Image Caption (Optional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Master Bedroom"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              >
                <option value="Construction Progress">Construction Progress</option>
                <option value="Completed Project">Completed Project</option>
                <option value="Interior">Interior</option>
                <option value="Exterior">Exterior</option>
                <option value="Event">Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ImageUploadField
                label="Gallery Photo Upload"
                value={formData.imageUrl}
                onChange={(url, publicId) => setFormData({ ...formData, imageUrl: url, publicId })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Related Project (Optional)</label>
              <select
                value={formData.relatedProject}
                onChange={(e) => setFormData({ ...formData, relatedProject: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
              >
                <option value="">None</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary w-max py-3 px-6 mt-2">
            Submit Image
          </button>
        </form>
      ) : loading ? (
        <div className="text-center py-8">Loading gallery...</div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-[#6B625A]">No gallery photos yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {images.map((img) => (
            <div key={img._id} className="relative aspect-square bg-white border border-amber-100 rounded-xl overflow-hidden group shadow-sm">
              <img src={img.image?.url} alt={img.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end p-2 items-start">
                <button
                  onClick={() => handleDelete(img._id)}
                  className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  title="Deactivate"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 text-white text-[10px] truncate leading-tight">
                {img.title || "No Caption"}
                <span className="block opacity-75 mt-0.5 text-[8px] uppercase">{img.category}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 4: TESTIMONIALS MODERATOR
// ─────────────────────────────────────────────────────────────────────────────
function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/testimonials");
      if (data.success) setTestimonials(data.data);
    } catch {
      toast.error("Failed to load testimonials list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.patch(`/admin/testimonials/${id}/approve`);
      toast.success("Testimonial approved");
      loadTestimonials();
    } catch {
      toast.error("Approval failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this testimonial?")) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      toast.success("Testimonial deleted");
      loadTestimonials();
    } catch {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="text-left">
      <h2 className="text-2xl font-bold font-display text-[#2E2A26] mb-6">Testimonials Moderator</h2>

      {loading ? (
        <div className="text-center py-8">Loading testimonials...</div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-8 text-[#6B625A]">No testimonials submitted yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {testimonials.map((t) => (
            <div key={t._id} className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-2 text-[#F5A623]">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <FiStar key={i} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm italic text-[#6B625A] leading-relaxed mb-4">"{t.message}"</p>
                <h4 className="font-bold text-xs text-[#2E2A26] uppercase">
                  — {t.customerName} {t.projectName ? `(flat owner in ${t.projectName})` : ""}
                </h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!t.isApproved ? (
                  <button
                    onClick={() => handleApprove(t._id)}
                    className="btn-primary flex items-center gap-1.5 text-xs py-2 px-4 shadow-sm"
                  >
                    <FiCheck /> Approve
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-200">
                    Live
                  </span>
                )}
                <button
                  onClick={() => handleDelete(t._id)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                  title="Delete"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 5: INQUIRIES MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function InquiriesTab() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadInquiries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/inquiries");
      if (data.success) setInquiries(data.data);
    } catch {
      toast.error("Failed to load inquiries list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/inquiries/${id}/status`, { status });
      toast.success("Inquiry status updated");
      loadInquiries();
    } catch {
      toast.error("Status update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this inquiry submission?")) return;
    try {
      await api.delete(`/admin/inquiries/${id}`);
      toast.success("Inquiry deleted");
      loadInquiries();
    } catch {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="text-left">
      <h2 className="text-2xl font-bold font-display text-[#2E2A26] mb-6">Contact Inquiries Inbox</h2>

      {loading ? (
        <div className="text-center py-8">Loading inquiries...</div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-8 text-[#6B625A]">No inquiries received yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {inquiries.map((inq) => (
            <div key={inq._id} className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm text-left">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-sm text-[#2E2A26]">{inq.name}</h3>
                  <span className="text-xs text-[#6B625A] block mt-0.5">
                    {inq.email} • {inq.phone}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={inq.status}
                    onChange={(e) => handleStatusChange(inq._id, e.target.value)}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 border border-amber-100 text-[#E8871E] focus:outline-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                  </select>
                  <button
                    onClick={() => handleDelete(inq._id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Delete Submission"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="bg-[#FFFBF5] rounded-xl p-4 border border-amber-50/50">
                {inq.subject && <p className="text-xs font-bold text-[#E8871E] mb-2">{inq.subject}</p>}
                <p className="text-xs text-[#6B625A] leading-relaxed">"{inq.message}"</p>
                {inq.interestedProject && (
                  <span className="inline-block mt-3 text-[10px] font-semibold bg-amber-100 text-[#E8871E] px-2.5 py-0.5 rounded-full">
                    Project: {inq.interestedProject.title}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 6: TEAM CRUD
// ─────────────────────────────────────────────────────────────────────────────
function TeamTab() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", designation: "", bio: "", photoUrl: "", photoPublicId: "" });

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

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      designation: formData.designation,
      bio: formData.bio,
      photo: formData.photoUrl ? { url: formData.photoUrl, publicId: formData.photoPublicId } : undefined,
    };
    try {
      await api.post("/admin/team", payload);
      toast.success("Team member added");
      setShowAddForm(false);
      setFormData({ name: "", designation: "", bio: "", photoUrl: "", photoPublicId: "" });
      loadTeam();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate (soft-delete) this member?")) return;
    try {
      await api.delete(`/admin/team/${id}`);
      toast.success("Member deactivated");
      loadTeam();
    } catch {
      toast.error("Deletion failed");
    }
  };

  return (
    <div className="text-left">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Team Dashboard</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary flex items-center gap-1.5 text-xs py-2.5"
        >
          {showAddForm ? "View Grid" : "Add Member"}
        </button>
      </div>

      {showAddForm ? (
        <form onSubmit={handleAddSubmit} className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 mb-8">
          <h3 className="text-lg font-bold font-display text-[#2E2A26]">Add Team Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aditya Bhai"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Designation</label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Founder & Director"
                className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Bio Description</label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Professional summary..."
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm resize-none"
            />
          </div>
          <div>
            <ImageUploadField
              label="Staff Photo Upload"
              value={formData.photoUrl}
              onChange={(url, publicId) => setFormData({ ...formData, photoUrl: url, photoPublicId: publicId })}
            />
          </div>
          <button type="submit" className="btn-primary w-max py-3 px-6 mt-2">
            Submit Member
          </button>
        </form>
      ) : loading ? (
        <div className="text-center py-8">Loading team...</div>
      ) : team.length === 0 ? (
        <div className="text-center py-8 text-[#6B625A]">No team members listed.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {team.map((member) => (
            <div key={member._id} className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-amber-50 mb-4 border border-amber-100">
                <img src={member.photo?.url || "https://placehold.co/100/FAC354/FFFFFF?text=Staff"} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <h4 className="font-bold text-sm text-[#2E2A26]">{member.name}</h4>
              <span className="text-[10px] font-semibold text-[#E8871E] uppercase mt-1 mb-2 block">{member.designation}</span>
              <p className="text-xs text-[#6B625A] line-clamp-3 leading-relaxed mb-4">{member.bio}</p>
              <div className="w-full flex justify-between items-center pt-3 border-t border-amber-50">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  member.isActive ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  {member.isActive ? "Active" : "Deactivated"}
                </span>
                <button onClick={() => handleDelete(member._id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg">
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 7: SITE SETTINGS EDITOR
// ─────────────────────────────────────────────────────────────────────────────
function SettingsTab() {
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    aboutUsShort: "",
    aboutUsFull: "",
    yearsOfExperience: 15,
    happyCustomers: 1000,
    address: "",
    phoneNumbers: "",
    email: "",
    instagramUrl: "",
    logoUrl: "",
    logoPublicId: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await api.get("/admin/settings");
        if (data.success && data.data) {
          const s = data.data;
          setFormData({
            companyName: s.companyName || "",
            tagline: s.tagline || "",
            aboutUsShort: s.aboutUsShort || "",
            aboutUsFull: s.aboutUsFull || "",
            yearsOfExperience: s.yearsOfExperience || 15,
            happyCustomers: s.happyCustomers || 1000,
            address: s.address || "",
            phoneNumbers: s.phoneNumbers?.join(", ") || "",
            email: s.email || "",
            instagramUrl: s.instagramUrl || "",
            logoUrl: s.logo?.url || "",
            logoPublicId: s.logo?.publicId || "",
          });
        }
      } catch {
        toast.error("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      phoneNumbers: formData.phoneNumbers ? formData.phoneNumbers.split(",").map(i => i.trim()).filter(Boolean) : [],
      logo: formData.logoUrl ? { url: formData.logoUrl, publicId: formData.logoPublicId } : undefined,
    };

    try {
      await api.patch("/admin/settings", payload);
      toast.success("Site settings updated successfully");
    } catch {
      toast.error("Failed to save settings.");
    }
  };

  if (loading) return <div className="text-center py-8">Loading site settings...</div>;

  return (
    <div className="text-left bg-white border border-amber-100 rounded-2xl p-8 shadow-sm">
      <h2 className="text-2xl font-bold font-display text-[#2E2A26] mb-6">CMS Settings Editor</h2>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
        <div>
          <ImageUploadField
            label="Brand Logo Upload"
            value={formData.logoUrl}
            onChange={(url, publicId) => setFormData({ ...formData, logoUrl: url, logoPublicId: publicId })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Company Name</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Tagline</label>
            <input
              type="text"
              required
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Years of Experience</label>
            <input
              type="number"
              required
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Happy Customers Count</label>
            <input
              type="number"
              required
              value={formData.happyCustomers}
              onChange={(e) => setFormData({ ...formData, happyCustomers: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm text-[#2E2A26]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Short Description (for Homepage)</label>
          <textarea
            required
            rows={2}
            value={formData.aboutUsShort}
            onChange={(e) => setFormData({ ...formData, aboutUsShort: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Full Story (for About Us Page)</label>
          <textarea
            required
            rows={5}
            value={formData.aboutUsFull}
            onChange={(e) => setFormData({ ...formData, aboutUsFull: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm resize-none leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Office Address</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Enquiry Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Phone Numbers (comma-separated)</label>
            <input
              type="text"
              required
              value={formData.phoneNumbers}
              onChange={(e) => setFormData({ ...formData, phoneNumbers: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Instagram Profile URL</label>
            <input
              type="url"
              required
              value={formData.instagramUrl}
              onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-max py-3 px-6 mt-4">
          Save Settings
        </button>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB COMPONENT 8: CHANGE PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("New password must be at least 8 characters");

    setSubmitting(true);
    try {
      const { data } = await api.patch("/admin/auth/change-password", {
        currentPassword,
        newPassword,
      });
      if (data.success) {
        toast.success("Password changed successfully. Please log in again.");
        setCurrentPassword("");
        setNewPassword("");
        // AuthContext automatically invalidates cookie on patch fail, but let's reload to trigger Login view
        window.location.reload();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-left bg-white border border-amber-100 rounded-2xl p-8 shadow-sm max-w-md">
      <h2 className="text-2xl font-bold font-display text-[#2E2A26] mb-6">Change Password</h2>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">Current Password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">New Password</label>
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-sm"
          />
        </div>

        <button type="submit" disabled={submitting} className="btn-primary justify-center text-sm py-3.5 mt-2">
          {submitting ? "Updating..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
