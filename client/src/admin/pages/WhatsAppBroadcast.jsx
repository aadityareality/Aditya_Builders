import { useState, useEffect, useRef } from "react";
import api from "../../hooks/api.js";
import toast from "react-hot-toast";
import { 
  FiSearch, FiSend, FiFileText, FiImage, FiGrid, FiUsers, 
  FiUpload, FiX, FiTrash2, FiEdit2, FiPlus, FiCheck, FiFilter, FiAlertCircle 
} from "react-icons/fi";
import Loader from "../../components/ui/Loader.jsx";
import { useSocket } from "../../hooks/useSocket.js";

export default function WhatsAppBroadcast() {
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Categories management
  const [customCategories, setCustomCategories] = useState([
    "AURA", "SKYLINE", "ICON", "SHREEJI", "ELEGANCE", "GOLD", "DREAMLAND", "ADITYA ST SOCIETY", "General"
  ]);
  const [selectedCategories, setSelectedCategories] = useState([]); // multi-selected categories
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Rename Category Modal State
  const [renamingCategory, setRenamingCategory] = useState(null); // old category name string
  const [renameInputValue, setRenameInputValue] = useState("");
  const [savingRename, setSavingRename] = useState(false);

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
  const [progress, setProgress] = useState(null);
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [campaignStatus, setCampaignStatus] = useState("");
  const activeCampaignIdRef = useRef(null);

  // Edit Customer Modal State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCategory, setEditCategory] = useState("General");
  const [savingEdit, setSavingEdit] = useState(false);

  useSocket({
    onCampaignProgress: (progressData) => {
      console.log("📢 Campaign progress received:", progressData);
      if (progressData && progressData.campaignId === activeCampaignIdRef.current) {
        setCampaignStatus(progressData.status);
        setProgress({
          current: progressData.current,
          total: progressData.targetCount,
          success: progressData.successCount,
          failure: progressData.failureCount
        });

        if (progressData.status === "Completed" || progressData.status === "Failed") {
          toast.success(`Campaign finished with status: ${progressData.status}!`);
          setSending(false);
          activeCampaignIdRef.current = null;
          setActiveCampaignId(null);
          fetchCampaignHistory();
        }
      }
    }
  });

  // Campaign History
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [deletingCampaignId, setDeletingCampaignId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Add Customer Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerCategory, setNewCustomerCategory] = useState("General");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerState, setNewCustomerState] = useState("");
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const fetchCampaignHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data } = await api.get("/admin/crm/campaigns");
      if (data.success) {
        setCampaignHistory(data.data || []);
      }
    } catch (err) {
      console.warn("Failed to load campaign history:", err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    try {
      setDeletingCampaignId(id);
      await api.delete(`/admin/crm/campaigns/${id}`);
      setCampaignHistory(prev => prev.filter(c => c._id !== id));
      toast.success("Campaign deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete campaign");
    } finally {
      setDeletingCampaignId(null);
      setConfirmDeleteId(null);
    }
  };

  const fetchAudience = async () => {
    try {
      const { data } = await api.get("/admin/crm/broadcast/audience");
      if (data?.success && data?.data) {
        setCustomers(data.data);

        // Collect all categories dynamically from customer records
        const foundCategories = new Set([
          "AURA", "SKYLINE", "ICON", "SHREEJI", "ELEGANCE", "GOLD", "DREAMLAND", "ADITYA ST SOCIETY", "General"
        ]);
        data.data.forEach(c => {
          if (c.category && c.category.trim()) {
            foundCategories.add(c.category.trim());
          }
        });
        setCustomCategories(Array.from(foundCategories));
      }
    } catch (err) {
      toast.error("Failed to refresh target audience.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Permanently delete the ${selectedIds.length} selected contacts and all their chats/messages? This action cannot be undone.`)) return;

    try {
      const itemsToDelete = selectedIds.map(id => {
        const found = customers.find(c => c._id === id);
        return {
          id: id,
          source: found ? found.source : "WhatsApp CRM"
        };
      });

      const { data } = await api.post("/admin/crm/customers/bulk-delete", {
        items: itemsToDelete
      });

      if (data.success) {
        toast.success(data.message || "Selected contacts deleted successfully!");
        setSelectedIds([]);
        await fetchAudience();
      } else {
        toast.error("Failed to delete contacts");
      }
    } catch (err) {
      console.error("Bulk delete failed:", err);
      toast.error(err.response?.data?.message || "Failed to delete contacts");
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.error("Please enter a customer name.");
      return;
    }
    if (!newCustomerPhone.trim()) {
      toast.error("Please enter a phone number.");
      return;
    }

    setCreatingCustomer(true);
    try {
      const { data } = await api.post("/admin/crm/customers", {
        name: newCustomerName,
        phone: newCustomerPhone,
        category: newCustomerCategory,
        city: newCustomerCity,
        state: newCustomerState
      });

      if (data.success) {
        toast.success("Customer added successfully!");
        setNewCustomerName("");
        setNewCustomerPhone("");
        setNewCustomerCategory("General");
        setNewCustomerCity("");
        setNewCustomerState("");
        setIsAddModalOpen(false);
        await fetchAudience();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add customer.");
    } finally {
      setCreatingCustomer(false);
    }
  };

  const handleCreateCategory = (e) => {
    e.preventDefault();
    const cat = newCategoryName.trim().toUpperCase();
    if (!cat) {
      toast.error("Please enter a category name.");
      return;
    }
    if (customCategories.includes(cat)) {
      toast.error(`Category "${cat}" already exists.`);
      return;
    }
    setCustomCategories(prev => [...prev, cat]);
    setSelectedCategories(prev => [...prev, cat]);
    setNewCategoryName("");
    setIsAddCategoryOpen(false);
    toast.success(`Category "${cat}" created!`);
  };

  const handleOpenRenameCategoryModal = (cat, e) => {
    if (e) e.stopPropagation();
    setRenamingCategory(cat);
    setRenameInputValue(cat);
  };

  const handleRenameCategorySubmit = async (e) => {
    e.preventDefault();
    if (!renamingCategory || !renameInputValue.trim()) return;
    const newCat = renameInputValue.trim().toUpperCase();

    if (newCat === renamingCategory) {
      setRenamingCategory(null);
      return;
    }

    setSavingRename(true);
    try {
      const { data } = await api.post("/admin/crm/categories/rename", {
        oldCategory: renamingCategory,
        newCategory: newCat
      });

      if (data.success) {
        toast.success(data.message || `Renamed category to ${newCat}!`);
        // Update selectedCategories state if old category was selected
        setSelectedCategories(prev => 
          prev.map(c => c === renamingCategory ? newCat : c)
        );
        setRenamingCategory(null);
        await fetchAudience();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to rename category.");
    } finally {
      setSavingRename(false);
    }
  };

  const handleOpenEditModal = (c, e) => {
    if (e) e.stopPropagation();
    setEditingCustomer(c);
    setEditName(c.name || "");
    setEditPhone(c.phone && !c.phone.startsWith("BLANK_") ? c.phone : "");
    setEditCategory(c.category || "General");
  };

  const handleSaveEditCustomer = async (e) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!editName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }

    setSavingEdit(true);
    try {
      const { data } = await api.patch(`/admin/crm/customers/${editingCustomer._id}`, {
        name: editName.trim(),
        phone: editPhone.trim(),
        category: editCategory.trim()
      });

      if (data.success) {
        toast.success("Contact updated successfully!");
        setEditingCustomer(null);
        await fetchAudience();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update contact.");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [audienceRes, projRes] = await Promise.all([
          api.get("/admin/crm/broadcast/audience"),
          api.get("/projects")
        ]);

        if (audienceRes.data?.success && audienceRes.data?.data) {
          setCustomers(audienceRes.data.data);
          const foundCategories = new Set([
            "AURA", "SKYLINE", "ICON", "SHREEJI", "ELEGANCE", "GOLD", "DREAMLAND", "ADITYA ST SOCIETY", "General"
          ]);
          audienceRes.data.data.forEach(c => {
            if (c.category && c.category.trim()) {
              foundCategories.add(c.category.trim());
            }
          });
          setCustomCategories(Array.from(foundCategories));
        }

        if (projRes.data?.success && projRes.data?.data) {
          setProjects(projRes.data.data);
        }

        await fetchCampaignHistory();
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

    const matchesCategory = 
      selectedCategories.length === 0 || 
      selectedCategories.some(cat => 
        (c.category || "General") === cat || 
        (Array.isArray(c.tags) && c.tags.includes(cat))
      );

    return matchesSearch && matchesProject && matchesStatus && matchesCategory;
  });

  // Valid contacts with non-blank phone numbers in the filtered view
  const validFilteredCustomers = filteredCustomers.filter(c => c.phone && c.phone.trim().length >= 10 && !c.phone.startsWith("BLANK_"));

  const toggleCategorySelection = (cat) => {
    setSelectedCategories(prev => {
      const exists = prev.includes(cat);
      if (exists) {
        return prev.filter(x => x !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(validFilteredCustomers.map(c => c._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectAllOneClick = () => {
    setSelectedIds(validFilteredCustomers.map(c => c._id));
    toast.success(`Selected all ${validFilteredCustomers.length} valid contacts!`);
  };

  const handleToggleSelect = (id, hasValidPhone) => {
    if (!hasValidPhone) {
      toast.error("Cannot select contact without a valid mobile number.");
      return;
    }
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      toast.error("Please select at least one contact with a valid phone number.");
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
    setCampaignStatus("Processing");

    try {
      let bodyData = messageBody;
      if (campaignType === "image") {
        bodyData = {
          url: mediaUrl,
          caption: messageBody
        };
      } else if (campaignType === "template") {
        bodyData = {
          templateName: "marketing_promotion",
          languageCode: "en",
          components: [
            {
              type: "BODY",
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

      if (data.success && data.data?.campaignId) {
        const cId = data.data.campaignId;
        activeCampaignIdRef.current = cId;
        setActiveCampaignId(cId);
        toast.success("Campaign broadcast started in background!");
        fetchCampaignHistory();
      } else {
        toast.error("Failed to start broadcast campaign");
        setSending(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast campaign");
      setSending(false);
    }
  };

  const leadStatuses = ["New", "Interested", "Follow Up", "Booked Visit", "Negotiation", "Won", "Lost"];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Loader size="md" />
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest animate-pulse">
          Loading campaign audience & categories...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="!text-xl md:!text-2xl font-bold text-[#2E2A26]">WhatsApp Marketing Campaigns</h1>
          <p className="text-xs text-[#6B625A] mt-1">
            Manage category-wise contact lists, edit names, numbers & categories, and broadcast campaign updates to single or multiple categories simultaneously.
          </p>
        </div>
      </div>

      {/* Category Selection Filter Header Bar */}
      <div className="bg-white rounded-2xl border border-amber-100/80 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiFilter className="text-[#F5A623] w-4 h-4" />
            <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider">
              Select Categories to Target (Select 1 or Multiple at a Time):
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCategoryOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-all"
          >
            <FiPlus className="w-3.5 h-3.5" />
            <span>+ Add Custom Category</span>
          </button>
        </div>

        {/* Multi-Select Category Pills with Edit Category Name Icon */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
              selectedCategories.length === 0
                ? "bg-[#2E2A26] text-white border-[#2E2A26] shadow-sm"
                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
            }`}
          >
            All Categories ({customers.length})
          </button>

          {customCategories.map(cat => {
            const isSelected = selectedCategories.includes(cat);
            const catCount = customers.filter(c => 
              (c.category || "General") === cat || 
              (Array.isArray(c.tags) && c.tags.includes(cat))
            ).length;
            return (
              <div
                key={cat}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-extrabold transition-all border ${
                  isSelected
                    ? "bg-[#F5A623] text-white border-[#F5A623] shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleCategorySelection(cat)}
                  className="flex items-center gap-1.5 py-0.5 outline-none"
                >
                  {isSelected && <FiCheck className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                  }`}>
                    {catCount}
                  </span>
                </button>
                
                {/* Rename Category Edit Icon */}
                <button
                  type="button"
                  onClick={(e) => handleOpenRenameCategoryModal(cat, e)}
                  className={`p-1 rounded-md transition-colors ${
                    isSelected ? "hover:bg-white/20 text-white" : "hover:bg-amber-100 text-amber-800"
                  }`}
                  title={`Rename Category "${cat}"`}
                >
                  <FiEdit2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {selectedCategories.length > 0 && (
          <div className="text-[11px] text-amber-800 font-bold bg-amber-50/50 px-3 py-1.5 rounded-lg border border-amber-100/50 flex items-center justify-between">
            <span>
              Active Filter: <span className="underline">{selectedCategories.join(", ")}</span> ({filteredCustomers.length} total contacts matching)
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategories([])}
              className="text-xs text-amber-900 font-extrabold hover:underline"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Area: Filters & Audience Selector Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-amber-50/50 pb-3">
            <div className="flex items-center gap-2">
              <FiUsers className="text-[#F5A623] w-5 h-5" />
              <h2 className="text-sm font-extrabold text-[#2E2A26] uppercase tracking-wider">Target Contacts</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllOneClick}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1"
              >
                <FiCheck className="w-3.5 h-3.5" />
                <span>Select All ({validFilteredCustomers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 bg-[#F5A623] hover:bg-[#E8871E] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                + Add Contact
              </button>
            </div>
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
              Selected Contacts: <strong className="text-amber-900">{selectedIds.length}</strong> / {validFilteredCustomers.length} Valid Numbers
            </span>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="text-red-600 hover:text-red-700 font-bold hover:underline text-[10px]"
                >
                  Delete Selected ({selectedIds.length})
                </button>
                <span className="text-gray-300 font-normal">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-gray-500 hover:text-gray-700 underline text-[10px]"
                >
                  Deselect All
                </button>
              </div>
            )}
          </div>

          {/* Table list */}
          <div className="overflow-x-auto overflow-y-auto border border-gray-100 rounded-xl max-h-[420px]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#FFFBF5] text-[#6B625A] font-extrabold uppercase border-b border-gray-100 sticky top-0 bg-amber-50/90 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        validFilteredCustomers.length > 0 &&
                        selectedIds.length === validFilteredCustomers.length
                      }
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                  </th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile Number</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Actions</th>
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
                    const hasValidPhone = Boolean(c.phone && c.phone.trim().length >= 10 && !c.phone.startsWith("BLANK_"));
                    const isChecked = selectedIds.includes(c._id);
                    return (
                      <tr 
                        key={c._id}
                        className={`hover:bg-amber-50/20 transition-colors ${
                          isChecked ? "bg-amber-50/40" : !hasValidPhone ? "bg-amber-50/10" : ""
                        }`}
                        onClick={() => handleToggleSelect(c._id, hasValidPhone)}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            disabled={!hasValidPhone}
                            checked={isChecked}
                            onChange={() => handleToggleSelect(c._id, hasValidPhone)}
                            className="rounded text-amber-500 focus:ring-amber-400 disabled:opacity-30 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          {c.name || "Unknown Customer"}
                        </td>
                        <td className="p-3">
                          {hasValidPhone ? (
                            <span className="font-mono text-gray-800 font-bold">{c.phone}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold">
                              <FiAlertCircle className="w-3 h-3 text-amber-600" /> Empty Mobile Number (Click ✏️ to add)
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100/70 text-amber-900 border border-amber-200/60">
                            {c.category || "General"}
                          </span>
                        </td>
                        <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleOpenEditModal(c, e)}
                            className="p-1.5 bg-gray-100 hover:bg-amber-100 text-gray-700 hover:text-amber-900 rounded-lg text-xs font-bold transition-all"
                            title="Edit Name, Number or Category"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Area: Broadcast Campaign Composer */}
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-50/50 pb-3">
            <FiSend className="text-[#F5A623] w-5 h-5" />
            <h2 className="text-sm font-extrabold text-[#2E2A26] uppercase tracking-wider">Compose Campaign</h2>
          </div>

          <form onSubmit={handleSendCampaign} className="space-y-4">
            {/* Campaign Message Type */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] mb-1">Message Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCampaignType("text")}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    campaignType === "text"
                      ? "bg-[#F5A623] text-white border-[#F5A623] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <FiFileText className="w-3.5 h-3.5" /> Text
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType("image")}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    campaignType === "image"
                      ? "bg-[#F5A623] text-white border-[#F5A623] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <FiImage className="w-3.5 h-3.5" /> Image
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType("template")}
                  className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition-all ${
                    campaignType === "template"
                      ? "bg-[#F5A623] text-white border-[#F5A623] shadow-sm"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <FiGrid className="w-3.5 h-3.5" /> Template
                </button>
              </div>
            </div>

            {/* Image Upload Input (if campaignType === 'image') */}
            {campaignType === "image" && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#6B625A]">Upload Media Image</label>
                {mediaUrl ? (
                  <div className="relative rounded-xl border border-amber-200 overflow-hidden bg-amber-50/20 p-2 flex items-center justify-between">
                    <img src={mediaUrl} alt="Campaign Media" className="w-12 h-12 object-cover rounded-lg" />
                    <span className="text-[10px] font-bold text-gray-600 truncate max-w-[140px]">
                      {uploadFilename || "Uploaded Image"}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setMediaUrl(""); setUploadFilename(""); }}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-amber-400 bg-gray-50/50 hover:bg-amber-50/20 transition-all">
                    <FiUpload className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-xs font-bold text-gray-600">
                      {uploading ? "Uploading Image..." : "Click to Upload Photo"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Campaign Message Body Input */}
            <div>
              <label className="block text-xs font-bold text-[#6B625A] mb-1">
                {campaignType === "image" ? "Caption Text" : "Message Body"}
              </label>
              <textarea
                rows={5}
                value={messageBody}
                onChange={(e) => setMessageBody(e.target.value)}
                placeholder={
                  campaignType === "template"
                    ? "Enter promotion description parameter..."
                    : "Type message... (Tip: {{name}} placeholder will auto-insert customer's name)"
                }
                className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
              />
            </div>

            {/* Target Summary */}
            <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-xs space-y-1">
              <div className="flex justify-between font-bold text-[#2E2A26]">
                <span>Recipients Selected:</span>
                <span className="text-[#F5A623]">{selectedIds.length} Contacts</span>
              </div>
              <p className="text-[10px] text-gray-500">
                Messages will automatically personalize greetings and skip blank phone numbers.
              </p>
            </div>

            {/* Progress Tracker */}
            {progress && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 space-y-2">
                <div className="flex justify-between text-xs font-bold text-amber-900">
                  <span>Status: {campaignStatus}</span>
                  <span>{progress.current} / {progress.total} Sent</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-[#F5A623] h-full transition-all duration-300"
                    style={{ width: `${Math.round((progress.current / progress.total) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-600">
                  <span className="text-emerald-600">Success: {progress.success}</span>
                  <span className="text-red-600">Failures: {progress.failure}</span>
                </div>
              </div>
            )}

            {/* Submit Broadcast Button */}
            <button
              type="submit"
              disabled={sending || selectedIds.length === 0}
              className="w-full py-3 bg-[#F5A623] hover:bg-[#E8871E] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-4 h-4" />
              <span>{sending ? "Broadcasting..." : `Send Broadcast (${selectedIds.length})`}</span>
            </button>
          </form>

          {/* Campaign History Log List */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider">Campaign History</h3>
            {historyLoading ? (
              <div className="text-center py-4 text-xs text-gray-400 italic">Loading campaign history...</div>
            ) : campaignHistory.length === 0 ? (
              <div className="text-center py-4 text-xs text-gray-400 italic">No broadcast campaigns sent yet.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {campaignHistory.map((camp) => (
                  <div key={camp._id} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white text-xs space-y-1 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 truncate max-w-[150px]">{camp.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          camp.status === "Completed" ? "bg-emerald-100 text-emerald-800" :
                          camp.status === "Processing" ? "bg-amber-100 text-amber-800 animate-pulse" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {camp.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(camp._id)}
                          className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                          title="Delete Campaign Record"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{camp.messagePreview || camp.messageType}</p>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 pt-1">
                      <span>{new Date(camp.createdAt).toLocaleDateString()}</span>
                      <span>Target: {camp.targetCount} | Sent: {camp.successCount}</span>
                    </div>

                    {confirmDeleteId === camp._id && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200 flex items-center justify-between text-[10px]">
                        <span className="font-bold text-red-800">Confirm delete record?</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp._id)}
                            disabled={deletingCampaignId === camp._id}
                            className="px-2 py-0.5 bg-red-600 text-white rounded font-bold hover:bg-red-700"
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-bold hover:bg-gray-300"
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: Add Custom Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-amber-100 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#2E2A26] uppercase tracking-wider">+ Add Custom Category</h3>
              <button type="button" onClick={() => setIsAddCategoryOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP_CLIENTS, ICON, ELEGANCE"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-[#F5A623] hover:bg-[#E8871E] text-white rounded-xl shadow-sm"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Rename Category Modal */}
      {renamingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-amber-100 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#2E2A26] uppercase tracking-wider">Rename Category</h3>
              <button type="button" onClick={() => setRenamingCategory(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRenameCategorySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Current Name</label>
                <input
                  type="text"
                  disabled
                  value={renamingCategory}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-100 text-gray-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">New Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AADITYA ICON"
                  value={renameInputValue}
                  onChange={(e) => setRenameInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingCategory(null)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRename}
                  className="px-4 py-1.5 text-xs font-bold bg-[#F5A623] hover:bg-[#E8871E] text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingRename ? "Renaming..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Contact Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-amber-100 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#2E2A26] uppercase tracking-wider">Edit Contact Profile</h3>
              <button type="button" onClick={() => setEditingCustomer(null)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEditCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="e.g. 9825012345"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold"
                >
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 text-xs font-bold bg-[#F5A623] hover:bg-[#E8871E] text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-amber-100 text-left">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-[#2E2A26] uppercase tracking-wider">Add New Contact</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9825012345"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B625A] mb-1">Category</label>
                <select
                  value={newCustomerCategory}
                  onChange={(e) => setNewCustomerCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold"
                >
                  {customCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#6B625A] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bhavnagar"
                    value={newCustomerCity}
                    onChange={(e) => setNewCustomerCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#6B625A] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Gujarat"
                    value={newCustomerState}
                    onChange={(e) => setNewCustomerState(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCustomer}
                  className="px-4 py-1.5 text-xs font-bold bg-[#F5A623] hover:bg-[#E8871E] text-white rounded-xl shadow-sm disabled:opacity-50"
                >
                  {creatingCustomer ? "Creating..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
