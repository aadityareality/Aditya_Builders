import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import toast from "react-hot-toast";
import { FiSearch, FiSend, FiFileText, FiImage, FiGrid, FiUsers, FiUpload, FiX } from "react-icons/fi";
import Loader from "../../components/ui/Loader.jsx";

export default function WhatsAppBroadcast() {
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  
  // Campaign Content
  const [campaignType, setCampaignType] = useState("text"); // text, template, image
  const [messageBody, setMessageBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadFilename, setUploadFilename] = useState("");
  
  // Progress tracker
  const [progress, setProgress] = useState(null); // { current, total, success, failure }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load customers/conversations and project list
        const [audienceRes, projRes] = await Promise.all([
          api.get("/admin/crm/broadcast/audience"),
          api.get("/projects")
        ]);

        if (audienceRes.data?.success && audienceRes.data?.data) {
          setCustomers(audienceRes.data.data);
        }

        if (projRes.data?.success && projRes.data?.data) {
          setProjects(projRes.data.data);
        }
      } catch (err) {
        toast.error("Failed to load campaign audience and projects.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadFilename(file.name);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/admin/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (data.success && data.url) {
        setMediaUrl(data.url);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Image upload error:", err);
      toast.error(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone || "").includes(searchQuery);

    const matchesProject = 
      selectedProject === "All" || 
      (c.interestedProject === selectedProject) || 
      (c.interestedProject?._id === selectedProject);

    const matchesStatus = 
      selectedStatus === "All" || 
      c.leadStatus === selectedStatus;

    return matchesSearch && matchesProject && matchesStatus;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredCustomers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Please select at least one contact to broadcast.");
      return;
    }

    if (campaignType === "text" && !messageBody.trim()) {
      toast.error("Message body cannot be empty.");
      return;
    }

    if (campaignType === "image" && (!mediaUrl || !messageBody.trim())) {
      toast.error("Please provide both image URL and caption text.");
      return;
    }

    if (!window.confirm(`Are you sure you want to broadcast this message to ${selectedIds.length} customer(s)?`)) {
      return;
    }

    setSending(true);
    setProgress({ current: 0, total: selectedIds.length, success: 0, failure: 0 });

    try {
      let bodyData = messageBody;
      if (campaignType === "image") {
        bodyData = {
          url: mediaUrl,
          caption: messageBody
        };
      } else if (campaignType === "template") {
        bodyData = {
          templateName: "marketing_promotion", // standard example
          languageCode: "en_US",
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: messageBody }
              ]
            }
          ]
        };
      }

      const { data } = await api.post("/admin/crm/broadcast", {
        customerIds: selectedIds,
        messageType: campaignType,
        body: bodyData
      });

      if (data.success) {
        toast.success(`Campaign completed! Sent: ${data.data.successCount}, Failed: ${data.data.failureCount}`);
        setProgress({
          current: selectedIds.length,
          total: selectedIds.length,
          success: data.data.successCount,
          failure: data.data.failureCount
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast campaign");
    } finally {
      setSending(false);
    }
  };

  const leadStatuses = ["New", "Interested", "Follow Up", "Booked Visit", "Negotiation", "Won", "Lost"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader size="md" />
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest animate-pulse">
          Loading campaign audience...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#2E2A26]">WhatsApp Marketing Campaigns</h1>
        <p className="text-xs text-[#6B625A] mt-1">
          Compose promotions, announcements, or custom updates and broadcast them to your selected customer database in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Filters & Audience Selector Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-50/50 pb-3">
            <FiUsers className="text-[#F5A623] w-5 h-5" />
            <h2 className="text-sm font-extrabold text-[#2E2A26] uppercase tracking-wider">Select Target Audience</h2>
          </div>

          {/* Filtering row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400 w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name or Phone..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>

            {/* Filter by Project */}
            <div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="All">All Projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
              >
                <option value="All">All Lead Statuses</option>
                {leadStatuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected contacts count alert */}
          <div className="bg-amber-50/40 rounded-xl px-4 py-2 text-[11px] font-bold text-amber-800 flex justify-between items-center border border-amber-100/50">
            <span>
              Selected Contacts: {selectedIds.length} / {filteredCustomers.length} (Matches Filters)
            </span>
            {selectedIds.length > 0 && (
              <button 
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-red-600 hover:text-red-700 underline text-[10px]"
              >
                Deselect All
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl max-h-96">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#FFFBF5] text-[#6B625A] font-extrabold uppercase border-b border-gray-100">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredCustomers.length > 0 &&
                        selectedIds.length === filteredCustomers.length
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                  </th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Lead Status</th>
                  <th className="p-3">City/State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700 font-semibold">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                      No matching contacts found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const isChecked = selectedIds.includes(c._id);
                    return (
                      <tr 
                        key={c._id}
                        className={`hover:bg-amber-50/10 cursor-pointer ${isChecked ? "bg-amber-50/20" : ""}`}
                        onClick={() => handleToggleSelect(c._id)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSelect(c._id)}
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                        </td>
                        <td className="p-3 text-gray-900 font-bold">{c.name || "Unknown Customer"}</td>
                        <td className="p-3">{c.phone}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            c.leadStatus === "Won" 
                              ? "bg-green-100 text-green-800" 
                              : c.leadStatus === "Lost"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {c.leadStatus || "New"}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">{c.city || "N/A"}{c.state ? `, ${c.state}` : ""}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Area: Composer Form & Campaign Execution */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-50/50 pb-3">
            <FiSend className="text-[#F5A623] w-5 h-5" />
            <h2 className="text-sm font-extrabold text-[#2E2A26] uppercase tracking-wider">Campaign Composer</h2>
          </div>

          <form onSubmit={handleSendCampaign} className="space-y-4">
            {/* Campaign Type Selectors */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCampaignType("text")}
                className={`py-2 px-1.5 rounded-xl border text-[10px] font-extrabold flex flex-col items-center gap-1.5 transition-colors ${
                  campaignType === "text"
                    ? "bg-[#FFFBF5] border-amber-500 text-[#F5A623]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FiFileText className="w-4 h-4" />
                Plain Text
              </button>
              
              <button
                type="button"
                onClick={() => setCampaignType("image")}
                className={`py-2 px-1.5 rounded-xl border text-[10px] font-extrabold flex flex-col items-center gap-1.5 transition-colors ${
                  campaignType === "image"
                    ? "bg-[#FFFBF5] border-amber-500 text-[#F5A623]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FiImage className="w-4 h-4" />
                Media / Image
              </button>

              <button
                type="button"
                onClick={() => setCampaignType("template")}
                className={`py-2 px-1.5 rounded-xl border text-[10px] font-extrabold flex flex-col items-center gap-1.5 transition-colors ${
                  campaignType === "template"
                    ? "bg-[#FFFBF5] border-amber-500 text-[#F5A623]"
                    : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <FiGrid className="w-4 h-4" />
                Template
              </button>
            </div>

            {/* If Media selected, show media URL field */}
            {campaignType === "image" && (
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase text-[#6B625A] tracking-wider block">Upload Image from Gallery</label>
                
                <div className="flex gap-2 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="campaign-image-upload"
                  />
                  <label
                    htmlFor="campaign-image-upload"
                    className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-amber-300 bg-amber-50/20 text-[#F5A623] hover:bg-amber-50/50 cursor-pointer rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    <FiUpload className="w-3.5 h-3.5" />
                    {uploading ? "Uploading..." : "Choose Image"}
                  </label>
                  
                  <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                    {uploadFilename || "No file chosen"}
                  </span>
                </div>

                {mediaUrl && (
                  <div className="relative mt-2 border border-gray-100 rounded-xl overflow-hidden max-h-32 bg-gray-50 flex items-center justify-center">
                    <img src={mediaUrl} alt="preview" className="max-h-32 object-contain" />
                    <button
                      type="button"
                      onClick={() => { setMediaUrl(""); setUploadFilename(""); }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                )}
                
                <div className="pt-1">
                  <span className="text-[9px] text-gray-400 block">Or paste direct URL:</span>
                  <input
                    type="url"
                    value={mediaUrl}
                    onChange={(e) => {
                      setMediaUrl(e.target.value);
                      if (e.target.value) setUploadFilename("Manual Link");
                    }}
                    placeholder="https://example.com/promo.jpg"
                    className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-xl text-[11px] outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Template placeholder prompt */}
            {campaignType === "template" && (
              <div className="bg-amber-50/30 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-900 font-semibold leading-relaxed">
                ℹ️ This will broadcast the pre-approved Meta template <strong>marketing_promotion</strong>. You can enter the parameter dynamic text value in the box below.
              </div>
            )}

            {/* Message Body */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold uppercase text-[#6B625A] tracking-wider">
                {campaignType === "image" ? "Image Caption Text" : campaignType === "template" ? "Template Parameter Text" : "Message Body Content"}
              </label>
              <textarea
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={
                  campaignType === "image" 
                    ? "Enter caption details..." 
                    : campaignType === "template"
                    ? "Enter dynamic value..."
                    : "Enter your promotional text here..."
                }
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none"
                required={campaignType === "text"}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={sending || selectedIds.length === 0}
              className="w-full bg-[#F5A623] hover:bg-[#E8871E] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
            >
              {sending ? (
                <>
                  <Loader size="xs" /> Sending Broadcast...
                </>
              ) : (
                <>
                  <FiSend className="w-4 h-4" /> Send Campaign Broadcast
                </>
              )}
            </button>
          </form>

          {/* Campaign Progress details */}
          {progress && (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 space-y-2 text-xs">
              <span className="font-extrabold text-gray-700 block uppercase tracking-wider text-[10px]">Campaign Status Report</span>
              <div className="flex justify-between font-semibold text-gray-500 mt-1">
                <span>Targets Selected:</span>
                <span className="font-bold text-gray-900">{progress.total}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Successful Delivery:</span>
                <span className="font-bold text-green-600">{progress.success}</span>
              </div>
              <div className="flex justify-between font-semibold text-gray-500">
                <span>Failed Logs:</span>
                <span className="font-bold text-red-600">{progress.failure}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-1.5 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
