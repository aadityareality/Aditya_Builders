import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import {
  FiMessageSquare, FiUsers, FiClock, FiTrendingUp,
  FiInbox, FiCheckCircle, FiAlertCircle, FiRefreshCw,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

const StatCard = ({ icon, label, value, sub, color = "green" }) => {
  const colorMap = {
    green: "from-emerald-500 to-[#25D366]",
    blue: "from-blue-500 to-blue-600",
    orange: "from-orange-400 to-amber-500",
    red: "from-red-400 to-red-500",
    purple: "from-purple-500 to-purple-600",
    gray: "from-gray-400 to-gray-500",
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-800">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
};

export default function ChatAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/crm/analytics");
      if (res.data.success) setData(res.data.data);
    } catch (err) {
      console.error("Failed to load CRM analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-[#25D366] flex items-center justify-center">
            <FaWhatsapp className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#2E2A26]">Chat Analytics</h1>
            <p className="text-xs text-[#6B625A]">WhatsApp CRM performance metrics</p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="text-center text-gray-400 text-sm py-20">Loading analytics...</div>
      ) : !data ? (
        <div className="text-center text-red-400 text-sm py-20">Failed to load. <button onClick={load} className="underline">Retry</button></div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<FiMessageSquare className="text-base" />}
              label="Messages Today"
              value={data.todayMessages}
              color="green"
            />
            <StatCard
              icon={<FiTrendingUp className="text-base" />}
              label="Messages This Week"
              value={data.weekMessages}
              color="blue"
            />
            <StatCard
              icon={<FiUsers className="text-base" />}
              label="Total Customers"
              value={data.totalCustomers}
              color="purple"
            />
            <StatCard
              icon={<FiClock className="text-base" />}
              label="Avg Response Time"
              value={data.avgResponseTimeMins > 0 ? `${data.avgResponseTimeMins}m` : "N/A"}
              sub={data.avgResponseTimeMins > 0 ? "Average first reply time (this week)" : "Not enough data yet"}
              color="orange"
            />
          </div>

          {/* Conversation Status Breakdown */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<FiInbox className="text-base" />}
              label="Total Conversations"
              value={data.totalConversations}
              color="gray"
            />
            <StatCard
              icon={<FiCheckCircle className="text-base" />}
              label="Open Chats"
              value={data.openConversations}
              color="green"
            />
            <StatCard
              icon={<FiAlertCircle className="text-base" />}
              label="Pending Chats"
              value={data.pendingConversations}
              color="orange"
            />
            <StatCard
              icon={<FiCheckCircle className="text-base" />}
              label="Closed Chats"
              value={data.closedConversations}
              color="gray"
            />
          </div>

          {/* Unread + Executives */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Unread summary */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FiInbox className="text-[#25D366]" /> Unread Conversations
              </h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-[#25D366] flex items-center justify-center text-white text-2xl font-extrabold">
                  {data.unreadChats}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">
                    {data.unreadChats === 0 ? "All caught up! 🎉" : `${data.unreadChats} chats waiting for reply`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Conversations with unread customer messages</p>
                </div>
              </div>
            </div>

            {/* Executives table */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <FiUsers className="text-[#25D366]" /> Team Members
              </h3>
              {data.executives?.length === 0 ? (
                <p className="text-xs text-gray-400">No team members found.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.executives.map(ex => (
                    <div key={ex._id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-xs font-bold text-gray-700">{ex.name}</p>
                        <p className="text-[10px] text-gray-400">{ex.email}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 capitalize">
                        {ex.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Note on Customer Satisfaction */}
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
            <p className="text-xs font-bold text-blue-600 mb-1">📌 Customer Satisfaction Rating</p>
            <p className="text-xs text-blue-500">
              Customer satisfaction rating is a future enhancement. It requires sending a post-resolution survey
              message to the customer on WhatsApp and tracking their reply. This has not been implemented to avoid
              sending unsolicited messages. You can enable this flow in a future update.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
