import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../hooks/api.js";
import StatusBadge from "../components/StatusBadge.jsx";
import toast from "react-hot-toast";
import { FiSearch, FiPhone, FiMail, FiPaperclip, FiArrowRight, FiEye, FiTrash2, FiClock } from "react-icons/fi";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

/**
 * Leads Page
 * Serves as a CRM dashboard to triage both full Contact Inquiries and quick Callback Requests.
 */
export default function Leads() {
  const [inquiries, setInquiries] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [currentSection, setCurrentSection] = useState("inquiries"); // inquiries, callbacks
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All"); // All, New, Contacted, Closed

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [inqRes, callRes] = await Promise.all([
        api.get("/admin/inquiries"),
        api.get("/admin/callback-requests"),
      ]);
      if (inqRes.data?.success) {
        setInquiries(inqRes.data.data);
      }
      if (callRes.data?.success) {
        setCallbacks(callRes.data.data);
      }
    } catch (err) {
      toast.error("Failed to load leads database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleQuickInquiryStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/inquiries/${id}/status`, { status });
      if (data.success) {
        toast.success(`Lead status set to ${status}`);
        setInquiries((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status } : item))
        );
      }
    } catch {
      toast.error("Could not update status.");
    }
  };

  const handleQuickCallbackStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/callback-requests/${id}/status`, { status });
      if (data.success) {
        toast.success(`Callback status set to ${status}`);
        setCallbacks((prev) =>
          prev.map((item) => (item._id === id ? { ...item, status } : item))
        );
      }
    } catch {
      toast.error("Could not update status.");
    }
  };

  const handleDeleteCallback = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this callback request?")) return;
    try {
      const { data } = await api.delete(`/admin/callback-requests/${id}`);
      if (data.success) {
        toast.success("Callback request deleted successfully");
        setCallbacks((prev) => prev.filter((item) => item._id !== id));
      }
    } catch {
      toast.error("Deletion failed.");
    }
  };

  // Filter lists based on selected CRM tab and search query
  const currentList = currentSection === "inquiries" ? inquiries : callbacks;

  const filteredLeads = currentList.filter((lead) => {
    const matchesTab = activeTab === "All" || lead.status === activeTab;
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  const tabs = ["All", "New", "Contacted", "Closed"];

  return (
    <div className="text-left">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Leads CRM Dashboard</h2>
          <p className="text-xs text-[#6B625A] mt-1">
            Review full contact forms and callback requests from website visitors.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute left-3.5 top-3.5 text-[#6B625A]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-100/70 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
          />
        </div>
      </div>

      {/* Segmented Section Switcher */}
      <div className="flex bg-amber-50/40 p-1.5 rounded-2xl border border-amber-100/40 mb-6 gap-2 w-full max-w-md">
        <button
          onClick={() => {
            setCurrentSection("inquiries");
            setActiveTab("All");
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all ${
            currentSection === "inquiries"
              ? "bg-white text-[#E8871E] shadow-sm border border-amber-100/20"
              : "text-[#6B625A] hover:text-[#2E2A26]"
          }`}
        >
          Full Inquiries ({inquiries.length})
        </button>
        <button
          onClick={() => {
            setCurrentSection("callbacks");
            setActiveTab("All");
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-center transition-all ${
            currentSection === "callbacks"
              ? "bg-white text-[#E8871E] shadow-sm border border-amber-100/20"
              : "text-[#6B625A] hover:text-[#2E2A26]"
          }`}
        >
          Callback Requests ({callbacks.length})
        </button>
      </div>

      {/* Workflow Filter Tabs */}
      <div className="flex border-b border-amber-100/50 gap-2 mb-6 select-none">
        {tabs.map((tab) => {
          const count = tab === "All"
            ? currentList.length
            : currentList.filter((item) => item.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all relative ${
                activeTab === tab
                  ? "border-[#F5A623] text-[#F5A623]"
                  : "border-transparent text-[#6B625A] hover:text-[#2E2A26]"
              }`}
            >
              {tab} ({count})
            </button>
          );
        })}
      </div>

      {/* Leads List Container */}
      {loading ? (
        <div className="flex justify-center py-16 bg-white border border-amber-100/60 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 bg-white border border-amber-100/60 rounded-2xl text-xs text-[#6B625A] font-medium italic">
          No records found in this category.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredLeads.map((lead) => {
            const isNew = lead.status === "New";
            const dateStr = new Date(lead.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            if (currentSection === "inquiries") {
              // RENDER FULL INQUIRIES
              return (
                <div
                  key={lead._id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden ${
                    isNew
                      ? "border-l-[5px] border-l-[#F5A623] border-amber-100"
                      : "border-amber-100/70 border-l-[5px] border-l-gray-300"
                  }`}
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h3 className={`text-sm text-[#2E2A26] truncate ${isNew ? "font-extrabold" : "font-bold"}`}>
                        {lead.name}
                      </h3>
                      <span className="text-[10px] text-[#6B625A]/60 font-semibold">{dateStr}</span>
                      {lead.attachments?.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-bold bg-amber-50 text-[#E8871E] border border-amber-100 px-1.5 py-0.5 rounded">
                          <FiPaperclip className="w-2.5 h-2.5" /> Photos
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-[#6B625A] mb-3">
                      <a href={`tel:${lead.phone}`} className="hover:text-[#E8871E] flex items-center gap-1 font-semibold">
                        <FiPhone className="w-3.5 h-3.5 shrink-0" /> {lead.phone}
                      </a>
                      <a href={`mailto:${lead.email}`} className="hover:text-[#E8871E] flex items-center gap-1 truncate font-semibold">
                        <FiMail className="w-3.5 h-3.5 shrink-0" /> {lead.email}
                      </a>
                    </div>

                    <div className="text-xs text-[#6B625A] bg-[#FFFBF5]/35 p-3 rounded-xl border border-amber-100/40">
                      <p className="line-clamp-2 italic">"{lead.message}"</p>
                      {lead.interestedProject && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#E8871E]">
                          <span>Project Interest:</span>
                          <Link
                            to={`${ADMIN_SLUG}/projects/${lead.interestedProject._id}/edit`}
                            className="hover:underline flex items-center gap-0.5"
                          >
                            {lead.interestedProject.title} <FiArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <select
                      value={lead.status}
                      onChange={(e) => handleQuickInquiryStatus(lead._id, e.target.value)}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 text-[#E8871E] focus:outline-none cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>

                    <Link
                      to={`${ADMIN_SLUG}/leads/${lead._id}`}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-[#E8871E] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
                    >
                      <FiEye className="w-4 h-4" /> View Details
                    </Link>
                  </div>
                </div>
              );
            } else {
              // RENDER CALLBACK REQUESTS
              return (
                <div
                  key={lead._id}
                  className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden ${
                    isNew
                      ? "border-l-[5px] border-l-[#F5A623] border-amber-100"
                      : "border-amber-100/70 border-l-[5px] border-l-gray-300"
                  }`}
                >
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                      <h3 className={`text-sm text-[#2E2A26] truncate ${isNew ? "font-extrabold" : "font-bold"}`}>
                        {lead.name}
                      </h3>
                      <span className="text-[10px] text-[#6B625A]/60 font-semibold">{dateStr}</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-[#6B625A] mb-3">
                      <a href={`tel:${lead.phone}`} className="hover:text-[#E8871E] flex items-center gap-1 font-semibold">
                        <FiPhone className="w-3.5 h-3.5 shrink-0" /> {lead.phone}
                      </a>
                      <span className="flex items-center gap-1 text-[#6B625A]/70">
                        <FiClock className="w-3.5 h-3.5 shrink-0" /> Preferred Call Time: <strong>{lead.preferredTime}</strong>
                      </span>
                    </div>

                    {lead.relatedProject && (
                      <div className="text-[10px] font-bold text-[#E8871E] bg-[#FFFBF5]/35 p-2 rounded-lg border border-amber-100/40 inline-flex items-center gap-1 select-none">
                        <span>Project Context:</span>
                        <Link
                          to={`${ADMIN_SLUG}/projects/${lead.relatedProject._id}/edit`}
                          className="hover:underline flex items-center gap-0.5"
                        >
                          {lead.relatedProject.title} <FiArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <select
                      value={lead.status}
                      onChange={(e) => handleQuickCallbackStatus(lead._id, e.target.value)}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-amber-50/50 border border-amber-200 text-[#E8871E] focus:outline-none cursor-pointer"
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>

                    <button
                      onClick={() => handleDeleteCallback(lead._id)}
                      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center"
                      title="Delete Request"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}
