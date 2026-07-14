import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { FiTrendingUp, FiActivity, FiDollarSign, FiCpu, FiUsers, FiAward } from "react-icons/fi";
import Loader from "../../components/ui/Loader.jsx";

export default function AdminAiDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/ai/dashboard-stats");
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      toast.error("Failed to load AI Dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader size="md" />
        <span className="text-xs text-gray-500 mt-3 font-semibold">Analyzing AI Logs...</span>
      </div>
    );
  }

  const {
    dailyCounts = [],
    leadDistribution = { hot: 0, warm: 0, cold: 0 },
    popularProjects = [],
    spendBreakdown = [],
    avgLatencyMs = 1500,
    conversionRate = 0
  } = stats || {};

  const totalCompletions = dailyCounts.reduce((acc, curr) => acc + curr.conversations, 0);
  const totalCostUSD = spendBreakdown.reduce((acc, curr) => acc + curr.totalSpend, 0);
  const totalTokens = spendBreakdown.reduce((acc, curr) => acc + curr.totalTokens, 0);

  // Compute percentages for lead distribution bar
  const totalLeads = leadDistribution.hot + leadDistribution.warm + leadDistribution.cold || 1;
  const hotPct = Math.round((leadDistribution.hot / totalLeads) * 100);
  const warmPct = Math.round((leadDistribution.warm / totalLeads) * 100);
  const coldPct = Math.round((leadDistribution.cold / totalLeads) * 100);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      
      {/* Title block */}
      <div className="flex items-center gap-4 bg-[#2E2A26] text-white p-6 rounded-2xl shadow-xl">
        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
          <FiCpu />
        </div>
        <div>
          <h1 className="!text-xl md:!text-2xl font-extrabold tracking-tight text-white">AI Assistant Insights</h1>
          <p className="text-xs text-amber-200 mt-1">Review AI bot conversations, API cost metrics, and lead qualification charts</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-amber-100/30 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#6B625A] uppercase tracking-widest block">Total Chat Requests</span>
            <span className="text-xl font-extrabold text-[#2E2A26] block">{totalCompletions}</span>
            <span className="text-[9px] font-bold text-gray-400 block">Excluding stateless menus</span>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center text-lg">
            <FiActivity />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-amber-100/30 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#6B625A] uppercase tracking-widest block">Accumulated Cost</span>
            <span className="text-xl font-extrabold text-[#2E2A26] block">${totalCostUSD.toFixed(4)}</span>
            <span className="text-[9px] font-bold text-gray-400 block">Avg token spend per API call</span>
          </div>
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-lg">
            <FiDollarSign />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-amber-100/30 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#6B625A] uppercase tracking-widest block">Average Latency</span>
            <span className="text-xl font-extrabold text-[#2E2A26] block">{(avgLatencyMs / 1000).toFixed(2)}s</span>
            <span className="text-[9px] font-bold text-gray-400 block">AI round-trip lookup time</span>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-lg">
            <FiTrendingUp />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-amber-100/30 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#6B625A] uppercase tracking-widest block">Conversion Rate</span>
            <span className="text-xl font-extrabold text-[#2E2A26] block">{conversionRate}%</span>
            <span className="text-[9px] font-bold text-gray-400 block">Leads won vs Total Leads</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center text-lg">
            <FiAward />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Daily Conversations Chart (Custom CSS Bar chart) */}
        <div className="bg-white border border-amber-100/30 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider mb-4">Daily Conversation Count</h3>
            <div className="flex items-end justify-between h-40 gap-2 px-2 pt-6">
              {dailyCounts.map((day, idx) => {
                // Determine height pct relative to max count
                const maxVal = Math.max(...dailyCounts.map(d => d.conversations), 5);
                const heightPct = (day.conversations / maxVal) * 100;
                
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1 group relative">
                    {/* Tooltip */}
                    <span className="absolute -top-6 scale-0 transition-all rounded bg-gray-800 p-1 text-[8px] text-white group-hover:scale-100 z-10 font-bold whitespace-nowrap">
                      {day.conversations} chats
                    </span>
                    <div className="w-full bg-gray-100 rounded-t-lg h-full flex items-end">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${heightPct}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                        className="w-full bg-amber-500 rounded-t-lg hover:bg-amber-600 transition-colors"
                      />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 mt-2 block tracking-tight">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Lead scoring profile distribution */}
        <div className="bg-white border border-amber-100/30 p-6 rounded-2xl shadow-sm space-y-6">
          <div>
            <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider mb-1">Lead Qualification Mix</h3>
            <p className="text-[10px] text-gray-400 font-semibold">Distribution of leads scored by AI heuristics</p>
          </div>

          <div className="space-y-4">
            {/* Horizontal progress stack bar */}
            <div className="h-6 rounded-full w-full overflow-hidden flex shadow-inner border border-gray-100">
              <div style={{ width: `${hotPct}%` }} className="bg-[#EF4444] h-full" title={`Hot Leads: ${hotPct}%`} />
              <div style={{ width: `${warmPct}%` }} className="bg-[#F5A623] h-full" title={`Warm Leads: ${warmPct}%`} />
              <div style={{ width: `${coldPct}%` }} className="bg-[#3B82F6] h-full" title={`Cold Leads: ${coldPct}%`} />
            </div>

            {/* Legend checklist */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col border-l-4 border-red-500 pl-3">
                <span className="text-[10px] font-extrabold text-red-500 uppercase tracking-wider">Hot Lead</span>
                <span className="text-sm font-extrabold text-[#2E2A26] mt-0.5">{leadDistribution.hot}</span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5">({hotPct}%)</span>
              </div>
              <div className="flex flex-col border-l-4 border-amber-500 pl-3">
                <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-wider">Warm Lead</span>
                <span className="text-sm font-extrabold text-[#2E2A26] mt-0.5">{leadDistribution.warm}</span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5">({warmPct}%)</span>
              </div>
              <div className="flex flex-col border-l-4 border-blue-500 pl-3">
                <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider">Cold Lead</span>
                <span className="text-sm font-extrabold text-[#2E2A26] mt-0.5">{leadDistribution.cold}</span>
                <span className="text-[8px] font-bold text-gray-400 mt-0.5">({coldPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Popular project recommendation searches */}
        <div className="bg-white border border-amber-100/30 p-6 rounded-2xl shadow-sm md:col-span-2">
          <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider mb-4">Top Searched & Suggested Projects</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-amber-50 text-[10px] font-extrabold text-[#6B625A] uppercase tracking-widest">
                  <th className="pb-3">Project Title</th>
                  <th className="pb-3 text-right">Inquiries & Recommendations</th>
                </tr>
              </thead>
              <tbody className="font-medium text-[#2E2A26]">
                {popularProjects.map((p, idx) => (
                  <tr key={idx} className="border-b border-amber-50/50 hover:bg-[#FFFBF5]/30">
                    <td className="py-3 font-bold">{p.name}</td>
                    <td className="py-3 text-right font-extrabold text-amber-600">{p.count} suggestions</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spend breakdowns by API action */}
        <div className="bg-white border border-amber-100/30 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-extrabold text-[#2E2A26] uppercase tracking-wider mb-4">Spend Breakdown</h3>
            <div className="space-y-4">
              {spendBreakdown.length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-semibold py-10">No spend logs logged.</p>
              ) : (
                spendBreakdown.map((item) => (
                  <div key={item._id} className="flex justify-between items-center text-xs">
                    <div className="space-y-0.5">
                      <span className="font-extrabold capitalize text-[#2E2A26] block">{item._id}</span>
                      <span className="text-[9px] text-gray-400 font-bold block">{item.calls} runs • {item.totalTokens.toLocaleString()} tokens</span>
                    </div>
                    <span className="font-extrabold text-amber-600 text-sm">
                      ${item.totalSpend.toFixed(5)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
