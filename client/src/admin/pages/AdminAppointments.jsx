import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import toast from "react-hot-toast";
import { 
  FiCalendar, 
  FiSearch, 
  FiRefreshCw, 
  FiDownload, 
  FiClock, 
  FiTrash2, 
  FiSend, 
  FiUser, 
  FiPhone, 
  FiCheckCircle, 
  FiXCircle, 
  FiCornerUpRight, 
  FiChevronsLeft, 
  FiChevronsRight, 
  FiList 
} from "react-icons/fi";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'calendar'
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");

  // Modals state
  const [rescheduleApt, setRescheduleApt] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (projectFilter) params.project = projectFilter;

      const { data } = await api.get("/admin/appointments", { params });
      if (data.success && data.data) {
        setAppointments(data.data);
      }
    } catch (err) {
      toast.error("Failed to load appointments registry");
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get("/admin/projects");
      if (data.success && data.data) {
        // filter out active only
        setProjects(data.data.filter(p => p.isActive));
      }
    } catch (err) {
      console.warn("Failed to load project filter options", err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [search, statusFilter, projectFilter]);

  useEffect(() => {
    loadProjects();
  }, []);

  // Cancel Appointment handler
  const handleCancelApt = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this site visit appointment?")) return;
    try {
      const { data } = await api.patch(`/admin/appointments/${id}/cancel`);
      if (data.success) {
        toast.success("Site visit cancelled successfully");
        loadAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel visit booking");
    }
  };

  // Manual reminder sender
  const handleSendReminder = async (id) => {
    const loadingToast = toast.loading("Dispatching automated WhatsApp reminder...");
    try {
      const { data } = await api.post(`/admin/appointments/${id}/reminder`);
      if (data.success) {
        toast.success("WhatsApp reminder delivered successfully", { id: loadingToast });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send WhatsApp reminder", { id: loadingToast });
    }
  };

  // Reschedule Form handler
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime) return toast.error("Please enter a valid Date and Time");
    
    setRescheduling(true);
    try {
      const { data } = await api.patch(`/admin/appointments/${rescheduleApt._id}/reschedule`, {
        preferredDate: newDate,
        preferredTime: newTime
      });
      if (data.success) {
        toast.success("Site visit rescheduled successfully");
        setRescheduleApt(null);
        setNewDate("");
        setNewTime("");
        loadAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reschedule appointment");
    } finally {
      setRescheduling(false);
    }
  };

  // Exporter CSV
  const downloadCSV = () => {
    const headers = [
      "Reference ID", 
      "Customer Name", 
      "Phone", 
      "Project Name", 
      "Date", 
      "Time", 
      "Visitors", 
      "Notes", 
      "Status", 
      "Booked At"
    ];
    const rows = appointments.map(apt => [
      apt.referenceId || "N/A",
      apt.customerName,
      apt.customerPhone,
      apt.projectName || "General Inquiry",
      new Date(apt.preferredDate).toLocaleDateString("en-IN"),
      apt.preferredTime,
      apt.numberOfVisitors,
      apt.notes || "",
      apt.status,
      new Date(apt.createdAt).toLocaleString("en-IN")
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Site_Visits_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calendar Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray = Array.from({ length: daysInMonth }, (_, idx) => idx + 1);
  const blanksArray = Array.from({ length: firstDayIndex }, (_, idx) => null);
  const calendarSlots = [...blanksArray, ...daysArray];

  const getAptsForDay = (day) => {
    if (!day) return [];
    return appointments.filter(apt => {
      const d = new Date(apt.preferredDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="text-left flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-amber-100 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Site Visit Appointments</h2>
          <p className="text-xs text-[#6B625A] mt-1">Manage scheduled property tours, rescheduling requests, and WhatsApp alerts.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggler */}
          <div className="flex bg-[#FFFBF5] border border-amber-100 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list" 
                  ? "bg-[#F5A623] text-white" 
                  : "text-[#6B625A] hover:text-[#2E2A26]"
              }`}
            >
              <FiList /> List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "calendar" 
                  ? "bg-[#F5A623] text-white" 
                  : "text-[#6B625A] hover:text-[#2E2A26]"
              }`}
            >
              <FiCalendar /> Calendar
            </button>
          </div>

          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold text-[#E8871E] transition-colors"
          >
            <FiDownload /> Export CSV
          </button>
          
          <button
            onClick={loadAppointments}
            className="p-2.5 bg-[#FFFBF5] border border-amber-100 hover:border-amber-200 rounded-xl text-[#6B625A] transition-colors shadow-sm"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Search Customer / Project</label>
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-3 text-[#A89F95]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] text-xs font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Filter Project</label>
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] text-xs font-semibold cursor-pointer bg-white"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] text-xs font-semibold cursor-pointer bg-white"
          >
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rescheduled">Rescheduled</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center items-center py-24 bg-white border border-amber-100/60 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
        </div>
      ) : viewMode === "list" ? (
        /* TABULAR VIEW */
        <div className="bg-white border border-amber-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-[#FFFBF5] border-b border-amber-100 text-[#6B625A] font-bold">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Visit Date & Time</th>
                  <th className="px-6 py-4 text-center">Visitors</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-50">
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-[#A89F95] font-bold">
                      No appointments matched your query.
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <tr key={apt._id} className="hover:bg-amber-50/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-[#E8871E]">
                        {apt.referenceId || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-extrabold text-[#2E2A26] flex items-center gap-1">
                            <FiUser className="text-[#A89F95]" /> {apt.customerName}
                          </span>
                          <span className="text-[10px] text-[#6B625A] font-semibold flex items-center gap-1">
                            <FiPhone className="text-[#A89F95]" /> {apt.customerPhone}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#2E2A26]">
                        {apt.projectName || "General Inquiry"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-[#2E2A26] flex items-center gap-1">
                            <FiCalendar className="text-[#A89F95]" /> 
                            {new Date(apt.preferredDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                          <span className="text-[10px] text-[#6B625A] font-bold flex items-center gap-1">
                            <FiClock className="text-[#A89F95]" /> {apt.preferredTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-[#2E2A26]">
                        {apt.numberOfVisitors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          apt.status === "Confirmed" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                          apt.status === "Rescheduled" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          apt.status === "Cancelled" ? "bg-red-50 text-red-600 border border-red-100" :
                          "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Send WhatsApp Reminder */}
                          {apt.status !== "Cancelled" && (
                            <button
                              onClick={() => handleSendReminder(apt._id)}
                              title="Send WhatsApp Reminder"
                              className="p-2 bg-amber-50 text-[#E8871E] hover:bg-amber-100 border border-amber-100 hover:border-amber-200 rounded-xl transition-all"
                            >
                              <FiSend className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Reschedule */}
                          {apt.status !== "Cancelled" && (
                            <button
                              onClick={() => {
                                setRescheduleApt(apt);
                                setNewDate(new Date(apt.preferredDate).toISOString().slice(0, 10));
                                setNewTime(apt.preferredTime);
                              }}
                              title="Reschedule Site Visit"
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 rounded-xl transition-all"
                            >
                              <FiCornerUpRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Cancel */}
                          {apt.status !== "Cancelled" && (
                            <button
                              onClick={() => handleCancelApt(apt._id)}
                              title="Cancel Site Visit"
                              className="p-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 hover:border-red-200 rounded-xl transition-all"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CALENDAR VIEW */
        <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-[#2E2A26] uppercase tracking-wider">
              {monthNames[month]} {year}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-amber-50 rounded-xl text-[#6B625A] border border-amber-100 transition-colors"
              >
                <FiChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCalendarDate(new Date())}
                className="px-3 py-1.5 hover:bg-amber-50 rounded-xl text-xs font-bold text-[#E8871E] border border-amber-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-amber-50 rounded-xl text-[#6B625A] border border-amber-100 transition-colors"
              >
                <FiChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div key={dayName} className="text-center font-bold text-[10px] text-[#6B625A] uppercase py-1 select-none">
                {dayName}
              </div>
            ))}

            {calendarSlots.map((day, idx) => {
              const dayApts = getAptsForDay(day);
              const isToday = day && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
              
              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border border-amber-100 rounded-xl p-2 text-left flex flex-col justify-between ${
                    day ? "bg-[#FFFBF5]/10 hover:bg-amber-50/20" : "bg-[#FFFBF5]/5 border-dashed border-amber-50"
                  } ${isToday ? "border-2 border-[#F5A623]" : ""} transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold ${day ? "text-[#2E2A26]" : "text-transparent"} ${
                      isToday ? "w-5 h-5 bg-[#F5A623] text-white flex items-center justify-center rounded-full" : ""
                    }`}>
                      {day}
                    </span>
                    {dayApts.length > 0 && (
                      <span className="w-4 h-4 rounded-full bg-amber-150 text-[#E8871E] text-[8px] font-bold flex items-center justify-center border border-amber-200">
                        {dayApts.length}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 mt-2 flex-grow overflow-y-auto max-h-[60px] custom-scrollbar">
                    {dayApts.slice(0, 3).map((apt) => (
                      <div
                        key={apt._id}
                        title={`${apt.customerName} - ${apt.projectName}\nTime: ${apt.preferredTime}\nVisitors: ${apt.numberOfVisitors}`}
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded truncate ${
                          apt.status === "Cancelled" ? "bg-red-50 text-red-600 border border-red-100" :
                          apt.status === "Rescheduled" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                          "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        }`}
                      >
                        {apt.preferredTime} {apt.customerName}
                      </div>
                    ))}
                    {dayApts.length > 3 && (
                      <span className="text-[7px] text-[#A89F95] font-bold select-none text-center">
                        + {dayApts.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleApt && (
        <div className="fixed inset-0 bg-[#2E2A26]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-amber-100 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 className="text-base font-bold text-[#2E2A26] border-b border-amber-50 pb-3">
              Reschedule Site Visit Booking
            </h3>
            
            <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4 mt-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Customer
                </label>
                <input
                  type="text"
                  disabled
                  value={`${rescheduleApt.customerName} (${rescheduleApt.customerPhone})`}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-50 bg-amber-50/20 font-bold text-[#6B625A]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Preferred Time (e.g. 10:30 AM) *
                </label>
                <input
                  type="text"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 10:30 AM"
                  className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-amber-50">
                <button
                  type="button"
                  onClick={() => setRescheduleApt(null)}
                  className="px-4 py-2 rounded-xl border border-amber-200 text-[#6B625A] hover:bg-amber-50/30 font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rescheduling}
                  className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-[#E8871E] text-white font-bold transition-all shadow-md"
                >
                  {rescheduling ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
