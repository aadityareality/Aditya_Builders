import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiBookOpen, FiX } from "react-icons/fi";
import Loader from "../../components/ui/Loader.jsx";

export default function AdminFaqManagement() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [category, setCategory] = useState("General");
  const [saving, setSaving] = useState(false);

  const categories = ["All", "General", "Booking", "Pricing", "RERA", "Finance", "Legal"];

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/ai/faqs");
      if (data.success) {
        setFaqs(data.data);
      }
    } catch (err) {
      toast.error("Failed to load grounding FAQs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setQuestion("");
    setAnswer("");
    setCategory("General");
    setIsOpen(true);
  };

  const openEditModal = (faq) => {
    setEditingId(faq._id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setCategory(faq.category || "General");
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      toast.error("Please fill in both question and answer fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = { question, answer, category };
      if (editingId) {
        const { data } = await api.put(`/admin/ai/faqs/${editingId}`, payload);
        if (data.success) {
          setFaqs(prev => prev.map(faq => faq._id === editingId ? data.data : faq));
          toast.success("FAQ updated successfully!");
        }
      } else {
        const { data } = await api.post("/admin/ai/faqs", payload);
        if (data.success) {
          setFaqs(prev => [data.data, ...prev]);
          toast.success("FAQ created successfully!");
        }
      }
      setIsOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const { data } = await api.delete(`/admin/ai/faqs/${id}`);
      if (data.success) {
        setFaqs(prev => prev.filter(faq => faq._id !== id));
        toast.success("FAQ removed successfully!");
      }
    } catch (err) {
      toast.error("Failed to delete FAQ.");
    }
  };

  // Filtering
  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCategory === "All" || 
      faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Title Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-[#2E2A26] text-white p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
            <FiBookOpen />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">AI Grounding FAQs</h1>
            <p className="text-xs text-amber-200 mt-1">Manage database facts that ground the WhatsApp AI Bot answers</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 transition-all duration-200 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add FAQ Fact</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative md:col-span-2">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search FAQs by keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-amber-100 bg-white text-xs font-medium text-[#2E2A26] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
          />
        </div>
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-amber-100 bg-white text-xs font-bold text-[#2E2A26] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat} Category</option>
            ))}
          </select>
        </div>
      </div>

      {/* FAQs List Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader size="md" />
          <span className="text-xs text-gray-500 mt-3 font-semibold">Loading FAQ Database...</span>
        </div>
      ) : filteredFaqs.length === 0 ? (
        <div className="bg-white border border-amber-100/50 rounded-2xl p-12 text-center shadow-md">
          <p className="text-gray-400 font-bold text-sm">No FAQs found matching filters.</p>
          <button 
            onClick={openAddModal}
            className="mt-4 text-xs font-extrabold text-amber-500 hover:text-amber-600 underline"
          >
            Create one now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {filteredFaqs.map((faq) => (
              <motion.div
                key={faq._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-amber-100/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500/10 text-amber-600 mb-3 uppercase tracking-wider">
                      {faq.category || "General"}
                    </span>
                    <h3 className="font-extrabold text-xs text-[#2E2A26] leading-relaxed">
                      Q: {faq.question}
                    </h3>
                    <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed whitespace-pre-line">
                      A: {faq.answer}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditModal(faq)}
                      className="p-2.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-colors"
                      title="Edit FAQ"
                    >
                      <FiEdit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete FAQ"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Slide-In Modal Form */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#2E2A26]/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#FFFBF5] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-amber-100"
          >
            <div className="bg-[#2E2A26] text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider">
                {editingId ? "Edit Grounding FAQ" : "Add Grounding FAQ"}
              </h3>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#6B625A] mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-100 bg-white text-xs font-bold text-[#2E2A26] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
                >
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#6B625A] mb-1.5">
                  Question Fact
                </label>
                <input
                  type="text"
                  placeholder="e.g. What documents are needed to book a home?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-100 bg-white text-xs font-medium text-[#2E2A26] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#6B625A] mb-1.5">
                  Answer Details (Grounded Fact)
                </label>
                <textarea
                  rows="4"
                  placeholder="Provide precise details. Do not exaggerate or add unverified metrics."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-100 bg-white text-xs font-medium text-[#2E2A26] focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-sm resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Fact"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
