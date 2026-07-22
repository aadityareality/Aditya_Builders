import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../hooks/api.js";
import { useSocket } from "../../hooks/useSocket.js";
import {
  FiSearch, FiSend, FiX, FiRefreshCw, FiTag, FiUser,
  FiEdit2, FiTrash2, FiDownload, FiWifi, FiWifiOff,
  FiPhone, FiMail, FiMapPin, FiMessageSquare, FiCheck,
  FiCheckCircle, FiAlertCircle, FiImage, FiFile, FiVideo,
  FiMic, FiMoreVertical, FiFilter, FiChevronDown,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const LEAD_STATUSES = ["Hot", "Warm", "Cold", "Booked", "Lost"];
const CHAT_STATUSES = ["Open", "Closed", "Pending", "Archived"];
const FILTER_TABS = ["All", "Unread", "Open", "Pending", "Closed", "Hot", "Warm", "Cold", "Booked", "Lost", "Archived"];
const TAGS = ["Urgent", "VIP", "Investor", "Hot Lead", "Cold Lead", "Booked", "Site Visit", "Negotiation"];

const LEAD_COLORS = {
  Hot: "bg-red-100 text-red-700",
  Warm: "bg-orange-100 text-orange-700",
  Cold: "bg-blue-100 text-blue-700",
  Booked: "bg-green-100 text-green-700",
  Lost: "bg-gray-100 text-gray-500",
};

const STATUS_COLORS = {
  Open: "bg-emerald-100 text-emerald-700",
  Closed: "bg-gray-100 text-gray-500",
  Pending: "bg-yellow-100 text-yellow-700",
  Archived: "bg-purple-100 text-purple-500",
};

// ── Delivery status tick helper ──────────────────────────────────────────────
const DeliveryTick = ({ status }) => {
  if (status === "read") return <span className="text-blue-500 text-xs">✓✓</span>;
  if (status === "delivered") return <span className="text-gray-500 text-xs">✓✓</span>;
  if (status === "sent") return <span className="text-gray-400 text-xs">✓</span>;
  if (status === "failed") return <FiAlertCircle className="text-red-500 text-xs" />;
  return null;
};

// ── Message bubble renderer ───────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isOut = msg.direction === "outgoing";
  const body = msg.body;

  const renderBody = () => {
    if (msg.messageType === "text") {
      return <p className="text-sm whitespace-pre-wrap break-words">{body}</p>;
    }
    if (msg.messageType === "image") {
      return (
        <div>
          {body?.cloudinaryUrl ? (
            <a href={body.cloudinaryUrl} target="_blank" rel="noreferrer">
              <img src={body.cloudinaryUrl} alt="img" className="max-w-xs rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition" />
            </a>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-400 italic">
              <FiImage /> <span>{body?.mediaError || "Image unavailable"}</span>
            </div>
          )}
          {body?.caption && <p className="text-xs mt-1 opacity-70">{body.caption}</p>}
        </div>
      );
    }
    if (msg.messageType === "document") {
      return (
        <div className="flex items-center gap-3 bg-white/20 rounded-lg px-3 py-2">
          <FiFile className="text-2xl shrink-0" />
          <div>
            <p className="text-sm font-medium">{body?.fileName || "Document"}</p>
            {body?.cloudinaryUrl ? (
              <a href={body.cloudinaryUrl} target="_blank" rel="noreferrer" className="text-xs underline opacity-70">Download</a>
            ) : (
              <span className="text-xs opacity-50">Unavailable</span>
            )}
          </div>
        </div>
      );
    }
    if (msg.messageType === "video") {
      return body?.cloudinaryUrl ? (
        <video src={body.cloudinaryUrl} controls className="max-w-xs rounded-lg max-h-48" />
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400 italic"><FiVideo /> Video unavailable</div>
      );
    }
    if (msg.messageType === "audio") {
      return body?.cloudinaryUrl ? (
        <audio src={body.cloudinaryUrl} controls className="max-w-xs" />
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-400 italic"><FiMic /> Voice note unavailable</div>
      );
    }
    if (msg.messageType === "location") {
      const lat = body?.latitude;
      const lng = body?.longitude;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      return (
        <a href={mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm underline">
          <FiMapPin /> {body?.name || "Location"} ({lat?.toFixed(4)}, {lng?.toFixed(4)})
        </a>
      );
    }
    if (msg.messageType === "sticker") {
      return <p className="text-sm italic opacity-60">[Sticker]</p>;
    }
    if (msg.messageType === "contact") {
      const contacts = Array.isArray(body) ? body : [body];
      return (
        <div className="text-sm">
          {contacts.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <FiUser className="text-xs" />
              <span>{c?.name?.formatted_name || "Contact"}</span>
            </div>
          ))}
        </div>
      );
    }
    // Interactive / template
    return <p className="text-xs text-gray-400 italic">[{msg.messageType}]</p>;
  };

  return (
    <div className={`flex ${isOut ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`max-w-sm rounded-2xl px-4 py-2.5 shadow-sm ${
        isOut ? "bg-[#DCF8C6] text-gray-800 rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm border border-gray-100"
      }`}>
        {!isOut && (
          <p className="text-[10px] font-bold text-[#25D366] mb-1">Customer</p>
        )}
        {isOut && msg.sentBy && (
          <p className="text-[10px] font-bold text-emerald-600 mb-1">{msg.sentBy.name}</p>
        )}
        {isOut && !msg.sentBy && (
          <p className="text-[10px] font-bold text-gray-400 mb-1">Bot / Automated</p>
        )}
        {renderBody()}
        <div className={`flex items-center gap-1 mt-1 ${isOut ? "justify-end" : "justify-start"}`}>
          <span className="text-[10px] text-gray-400">
            {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isOut && <DeliveryTick status={msg.deliveryStatus} />}
        </div>
      </div>
    </div>
  );
};

// ── Main CRM Dashboard Component ─────────────────────────────────────────────
export default function WhatsAppCRM() {
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [executives, setExecutives] = useState([]);
  const [connected, setConnected] = useState(false);
  const [typingInfo, setTypingInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);

  const [aiSuggestion, setAiSuggestion] = useState("");
  const [fetchingAiSuggestion, setFetchingAiSuggestion] = useState(false);

  const fetchAiSuggestion = useCallback(async (chatId) => {
    if (!chatId) return;
    try {
      setAiSuggestion("");
      setFetchingAiSuggestion(true);
      const { data } = await api.get(`/admin/ai/smart-reply?chatId=${chatId}`);
      if (data.success && data.data?.suggestedReply) {
        setAiSuggestion(data.data.suggestedReply);
      }
    } catch (err) {
      console.warn("Failed to fetch smart reply suggestion:", err.message);
    } finally {
      setFetchingAiSuggestion(false);
    }
  }, []);

  // ── Socket.IO real-time handlers ───────────────────────────────────────────
  const { emitTyping, isConnected } = useSocket({
    onMessageNew: (data) => {
      // Update message list if the incoming chat is currently open
      setConversations(prev => {
        const exists = prev.find(c => c.chatId?.toString() === data.chatId?.toString());
        if (exists) {
          return prev.map(c =>
            c.chatId?.toString() === data.chatId?.toString()
              ? { ...c, customer: data.customer || c.customer }
              : c
          ).sort((a, b) => {
            const tA = a.customer?.lastMessageAt ? new Date(a.customer.lastMessageAt).getTime() : 0;
            const tB = b.customer?.lastMessageAt ? new Date(b.customer.lastMessageAt).getTime() : 0;
            return tB - tA;
          });
        }
        // New conversation — prepend to list
        return [{ customer: data.customer, chatId: data.chatId, chatStatus: "Open" }, ...prev];
      });

      if (selectedChat?.toString() === data.chatId?.toString()) {
        setMessages(prev => [...prev, data.message]);
        if (data.message.direction === "incoming") {
          fetchAiSuggestion(data.chatId);
        }
      }
    },
    onMessageStatus: ({ chatId, messageId, status }) => {
      if (selectedChat?.toString() === chatId?.toString()) {
        setMessages(prev => prev.map(m =>
          m._id === messageId ? { ...m, deliveryStatus: status } : m
        ));
      }
    },
    onMessagesRead: ({ chatId }) => {
      setConversations(prev => prev.map(c =>
        c.chatId?.toString() === chatId?.toString()
          ? { ...c, customer: { ...c.customer, unreadCount: 0 } }
          : c
      ));
    },
    onChatStatusChanged: ({ chatId, status }) => {
      setConversations(prev => prev.map(c =>
        c.chatId?.toString() === chatId?.toString() ? { ...c, chatStatus: status } : c
      ));
    },
    onChatDeleted: ({ chatId }) => {
      setConversations(prev => prev.filter(c => c.chatId?.toString() !== chatId?.toString()));
      if (selectedChat?.toString() === chatId?.toString()) {
        setSelectedChat(null);
        setSelectedCustomer(null);
        setMessages([]);
      }
    },
    onCustomerUpdated: ({ customer }) => {
      setConversations(prev => prev.map(c =>
        c.customer?._id === customer._id ? { ...c, customer } : c
      ));
      if (selectedCustomer?._id === customer._id) setSelectedCustomer(customer);
    },
    onTyping: ({ adminName, customerId, isTyping }) => {
      if (selectedCustomer?._id === customerId) {
        setTypingInfo(isTyping ? adminName : null);
        clearTimeout(typingTimer.current);
        if (isTyping) typingTimer.current = setTimeout(() => setTypingInfo(null), 4000);
      }
    }
  });

  useEffect(() => {
    const interval = setInterval(() => setConnected(isConnected()), 2000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // ── Load conversation list ─────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === "Unread") params.unread = "true";
      else if (["Open", "Closed", "Pending", "Archived"].includes(filter)) params.status = filter;
      else if (["Hot", "Warm", "Cold", "Booked", "Lost"].includes(filter)) params.leadStatus = filter;
      if (search) params.search = search;

      const { data } = await api.get("/admin/crm/conversations", { params });
      if (data.success) setConversations(data.data || []);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load analytics for executives list ────────────────────────────────────
  useEffect(() => {
    api.get("/admin/crm/analytics")
      .then(({ data }) => { if (data.success) setExecutives(data.data.executives || []); })
      .catch(() => {});
  }, []);

  // ── Load messages for selected chat ───────────────────────────────────────
  const openChat = async (conv) => {
    setSelectedChat(conv.chatId);
    setSelectedCustomer(conv.customer);
    setMsgLoading(true);
    setMessages([]);
    fetchAiSuggestion(conv.chatId);
    try {
      const { data } = await api.get(`/admin/crm/conversations/${conv.chatId}/messages`);
      if (data.success) {
        setMessages(data.data || []);
        // Clear unread badge locally
        setConversations(prev => prev.map(c =>
          c.chatId?.toString() === conv.chatId?.toString()
            ? { ...c, customer: { ...c.customer, unreadCount: 0 } }
            : c
        ));
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setMsgLoading(false);
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send reply ─────────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || !selectedChat || sending) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText("");
    emitTyping(selectedCustomer?._id, false);
    try {
      const { data } = await api.post(`/admin/crm/conversations/${selectedChat}/reply`, {
        messageType: "text",
        body: text,
      });
      if (data.success) {
        setMessages(prev => [...prev, data.data]);
        setAiSuggestion("");
      }
    } catch (err) {
      console.error("Reply failed:", err);
      setReplyText(text); // restore on failure
    } finally {
      setSending(false);
    }
  };

  // ── Update customer field ──────────────────────────────────────────────────
  const updateCustomerField = async (field, value) => {
    try {
      const { data } = await api.patch(`/admin/crm/customers/${selectedCustomer._id}`, { [field]: value });
      if (data.success) {
        setSelectedCustomer(data.data);
        setConversations(prev => prev.map(c =>
          c.customer?._id === data.data._id ? { ...c, customer: data.data } : c
        ));
      }
    } catch (err) {
      console.error("Update customer failed:", err);
    }
  };

  // ── Add internal note ──────────────────────────────────────────────────────
  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const { data } = await api.post(`/admin/crm/customers/${selectedCustomer._id}/notes`, { text: newNote });
      if (data.success) {
        setSelectedCustomer(prev => ({
          ...prev,
          internalNotes: [...(prev.internalNotes || []), data.data],
        }));
        setNewNote("");
      }
    } catch (err) {
      console.error("Add note failed:", err);
    }
  };

  // ── Tag toggle ─────────────────────────────────────────────────────────────
  const toggleTag = async (tag) => {
    const currentTags = selectedCustomer?.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    try {
      const { data } = await api.put(`/admin/crm/customers/${selectedCustomer._id}/tags`, { tags: newTags });
      if (data.success) {
        setSelectedCustomer(prev => ({ ...prev, tags: data.tags }));
      }
    } catch (err) {
      console.error("Tag update failed:", err);
    }
  };

  // ── Update chat status ─────────────────────────────────────────────────────
  const updateChatStatus = async (status) => {
    try {
      await api.patch(`/admin/crm/conversations/${selectedChat}/status`, { status });
      setConversations(prev => prev.map(c =>
        c.chatId?.toString() === selectedChat?.toString() ? { ...c, chatStatus: status } : c
      ));
    } catch (err) { console.error("Status update failed:", err); }
  };

  // ── Delete chat ────────────────────────────────────────────────────────────
  const deleteChat = async () => {
    if (!window.confirm("Permanently delete this conversation and all messages?")) return;
    try {
      await api.delete(`/admin/crm/conversations/${selectedChat}`);
      setSelectedChat(null);
      setSelectedCustomer(null);
      setMessages([]);
      loadConversations();
    } catch (err) { console.error("Delete failed:", err); }
  };

  // ── Delete customer profile completely ──────────────────────────────────────
  const deleteCustomerProfile = async () => {
    if (!selectedCustomer) return;
    if (!window.confirm(`Permanently delete customer "${selectedCustomer.name}" and all their chats/messages? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/crm/customers/${selectedCustomer._id}`);
      setSelectedChat(null);
      setSelectedCustomer(null);
      setMessages([]);
      loadConversations();
    } catch (err) {
      console.error("Delete customer profile failed:", err);
      alert(`Delete failed: ${err.response?.data?.message || err.message}`);
    }
  };

  // ── Export chat ────────────────────────────────────────────────────────────
  const exportChat = (format) => {
    const url = `${import.meta.env.VITE_API_URL}/admin/crm/conversations/${selectedChat}/export?format=${format}`;
    window.open(url, "_blank");
  };

  // ── Online indicator (last active < 5 min = online) ───────────────────────
  const isOnline = (customer) => {
    if (!customer?.lastActiveAt) return false;
    return (Date.now() - new Date(customer.lastActiveAt).getTime()) < 5 * 60 * 1000;
  };

  // ── Typing emit ────────────────────────────────────────────────────────────
  const handleTyping = (val) => {
    setReplyText(val);
    if (selectedCustomer) {
      emitTyping(selectedCustomer._id, val.length > 0);
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => emitTyping(selectedCustomer._id, false), 3000);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100">

      {/* ── LEFT: Conversation List ─────────────────────────────────────── */}
      <aside className={`w-full md:w-80 shrink-0 border-r border-gray-100 flex flex-col bg-[#F7F8FA] ${
        selectedChat ? "hidden md:flex" : "flex"
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FaWhatsapp className="text-[#25D366] text-xl" />
              <h2 className="text-sm font-bold text-gray-800">WhatsApp CRM</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                {connected ? <FiWifi className="text-xs" /> : <FiWifiOff className="text-xs" />}
                {connected ? "Live" : "Offline"}
              </span>
              <button onClick={loadConversations} className="text-gray-400 hover:text-gray-600 transition" title="Refresh">
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search name, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-[#25D366]/40 focus:border-[#25D366]/40"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-2 overflow-x-auto scrollbar-none border-b border-gray-100 bg-white">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                filter === tab ? "bg-[#25D366] text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400 text-xs mt-8">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-xs mt-8">No conversations found</div>
          ) : (
            conversations.map((conv) => {
              const c = conv.customer;
              const isActive = selectedChat?.toString() === conv.chatId?.toString();
              const online = isOnline(c);
              const initial = c?.name?.[0]?.toUpperCase() || "?";

              return (
                <button
                  key={conv.chatId}
                  onClick={() => openChat(conv)}
                  className={`w-full text-left flex items-start gap-3 p-4 border-b border-gray-50 hover:bg-white transition-all ${
                    isActive ? "bg-white border-l-2 border-l-[#25D366]" : ""
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-emerald-700 flex items-center justify-center text-white text-sm font-bold">
                      {initial}
                    </div>
                    {online && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-gray-800 truncate">{c?.name || "Unknown"}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {c?.lastMessageAt ? new Date(c.lastMessageAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{c?.phone}</p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c?.lastMessage || "No messages yet"}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${LEAD_COLORS[c?.leadStatus] || "bg-gray-100 text-gray-500"}`}>
                        {c?.leadStatus}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[conv.chatStatus] || "bg-gray-100 text-gray-500"}`}>
                        {conv.chatStatus}
                      </span>
                      {c?.unreadCount > 0 && (
                        <span className="ml-auto bg-[#25D366] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ── CENTER: Chat Window ─────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${
        selectedChat ? "flex" : "hidden md:flex"
      }`}>
        {!selectedChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <FaWhatsapp className="text-6xl text-[#25D366]/30 mb-4" />
            <p className="text-sm font-medium">Select a conversation to start</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => { setSelectedChat(null); setSelectedCustomer(null); }}
                  className="p-1 text-gray-500 hover:text-gray-800 md:hidden mr-1 focus:outline-none"
                  aria-label="Back to conversations"
                >
                  <FiChevronDown className="w-5 h-5 rotate-90" />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25D366] to-emerald-700 flex items-center justify-center text-white text-xs font-bold">
                    {selectedCustomer?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  {isOnline(selectedCustomer) && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-white" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{selectedCustomer?.name}</p>
                  <p className="text-[10px] text-gray-500">{selectedCustomer?.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Chat status dropdown */}
                <select
                  value={conversations.find(c => c.chatId?.toString() === selectedChat?.toString())?.chatStatus || "Open"}
                  onChange={e => updateChatStatus(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                >
                  {CHAT_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => exportChat("csv")} className="p-1.5 text-gray-400 hover:text-gray-700 transition" title="Export CSV">
                  <FiDownload className="text-sm" />
                </button>
                <button onClick={deleteChat} className="p-1.5 text-gray-400 hover:text-red-500 transition" title="Delete Chat">
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#EBE5DE] bg-opacity-30">
              {msgLoading ? (
                <div className="text-center text-gray-400 text-xs mt-8">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 text-xs mt-8">No messages yet</div>
              ) : (
                messages.map(msg => <MessageBubble key={msg._id} msg={msg} />)
              )}
              {typingInfo && (
                <div className="text-xs text-gray-400 italic ml-2">
                  {typingInfo} is typing...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Smart Reply Widget */}
            {fetchingAiSuggestion && (
              <div className="bg-amber-50/20 border-t border-amber-100/30 px-4 py-2 flex items-center justify-between text-[10px] text-amber-600 font-bold italic select-none">
                AI Sales Assistant drafting a reply...
              </div>
            )}
            {aiSuggestion && (
              <div className="bg-[#FFFBF5] border-t border-amber-100/40 px-4 py-2.5 flex items-center justify-between gap-4 select-none">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-widest block mb-0.5">AI Smart Reply Suggestion</span>
                  <p className="text-xs text-gray-700 italic truncate font-medium">"{aiSuggestion}"</p>
                </div>
                <button
                  onClick={() => { setReplyText(aiSuggestion); setAiSuggestion(""); }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] px-3.5 py-1.5 rounded-xl shrink-0 transition shadow-sm"
                >
                  Use Draft
                </button>
              </div>
            )}

            {/* Reply Box */}
            <div className="border-t border-gray-100 bg-white p-3 flex items-end gap-2">
              <textarea
                value={replyText}
                onChange={e => handleTyping(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={2}
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#25D366]/40 resize-none"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-emerald-600 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <FiSend className="text-sm" />
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT: Customer Details Panel ──────────────────────────────── */}
      {selectedCustomer && (
        <aside className="hidden lg:flex w-72 shrink-0 border-l border-gray-100 bg-white flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#25D366] to-emerald-700 flex items-center justify-center text-white text-xl font-bold mb-2">
                {selectedCustomer.name?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm font-bold text-gray-800">{selectedCustomer.name}</p>
              <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
              {selectedCustomer.email && <p className="text-xs text-gray-400">{selectedCustomer.email}</p>}
              <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
                {(selectedCustomer.tags || []).map(tag => (
                  <span key={tag} className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Lead Status */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Lead Status</p>
            <select
              value={selectedCustomer.leadStatus}
              onChange={e => updateCustomerField("leadStatus", e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              {LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Assigned Executive */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Executive</p>
            <select
              value={selectedCustomer.assignedExecutive?._id || ""}
              onChange={e => updateCustomerField("assignedExecutive", e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {executives.map(ex => (
                <option key={ex._id} value={ex._id}>{ex.name} ({ex.role})</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="p-4 border-b border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all ${
                    (selectedCustomer.tags || []).includes(tag)
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-amber-400"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Interested Project */}
          {selectedCustomer.interestedProject && (
            <div className="p-4 border-b border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Interested Project</p>
              <p className="text-xs font-semibold text-[#25D366]">{selectedCustomer.interestedProject.title}</p>
              <p className="text-[10px] text-gray-400">{selectedCustomer.interestedProject.location}</p>
            </div>
          )}

          {/* Internal Notes */}
          <div className="p-4 flex-1">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Internal Notes</p>
            <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
              {(selectedCustomer.internalNotes || []).map((note, i) => (
                <div key={i} className="bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-700">{note.text}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    {note.createdBy?.name || "Admin"} · {new Date(note.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              ))}
              {(!selectedCustomer.internalNotes || selectedCustomer.internalNotes.length === 0) && (
                <p className="text-xs text-gray-400 italic">No notes yet</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addNote()}
                placeholder="Add private note..."
                className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-yellow-300"
              />
              <button
                onClick={addNote}
                className="px-2 py-1.5 bg-yellow-400 text-white rounded-lg text-xs font-bold hover:bg-yellow-500 transition"
              >
                Add
              </button>
            </div>
          </div>

          {/* Danger Zone / Delete Profile */}
          <div className="p-4 border-t border-gray-100 bg-red-50/10 shrink-0">
            <button
              onClick={deleteCustomerProfile}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-lg border border-red-200 transition"
            >
              Delete Customer Profile
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
