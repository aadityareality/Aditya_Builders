import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "./context/AdminAuthContext.jsx";
import api from "../hooks/api.js";
import {
  FiMail,
  FiLayers,
  FiMessageSquare,
  FiImage,
  FiUsers,
  FiSettings,
  FiKey,
  FiLogOut,
  FiExternalLink,
  FiCalendar,
  FiBarChart2,
  FiSend,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import logoImg from "../assets/logo.jpg";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

/**
 * AdminLayout Component
 * Minimal, clean dashboard shell layout.
 * Left sidebar navigation with status badges + Topbar admin credentials display.
 */
export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  // Poll server for new leads count to update notification badge
  const fetchNewLeadsCount = async () => {
    try {
      const { data } = await api.get("/admin/inquiries");
      if (data.success && data.data) {
        const count = data.data.filter((item) => item.status === "New").length;
        setNewLeadsCount(count);
      }
    } catch (err) {
      console.warn("Could not retrieve leads status notification count", err);
    }
  };

  useEffect(() => {
    if (admin) {
      fetchNewLeadsCount();
      // Poll every 30 seconds for updates
      const timer = setInterval(fetchNewLeadsCount, 30000);
      return () => clearInterval(timer);
    }
  }, [admin, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate(`${ADMIN_SLUG}/login`);
  };

  const navLinks = [
    {
      name: "Leads Inbox",
      path: `${ADMIN_SLUG}/leads`,
      icon: <FiMail className="w-4 h-4" />,
      badge: newLeadsCount > 0 ? newLeadsCount : null,
    },
    {
      name: "Appointments",
      path: `${ADMIN_SLUG}/appointments`,
      icon: <FiCalendar className="w-4 h-4" />,
    },
    {
      name: "WhatsApp CRM",
      path: `${ADMIN_SLUG}/whatsapp-crm`,
      icon: <FaWhatsapp className="w-4 h-4" />,
    },
    {
      name: "Chat Analytics",
      path: `${ADMIN_SLUG}/chat-analytics`,
      icon: <FiBarChart2 className="w-4 h-4" />,
    },
    {
      name: "WhatsApp Campaigns",
      path: `${ADMIN_SLUG}/broadcast`,
      icon: <FiSend className="w-4 h-4" />,
    },
    {
      name: "Projects Catalog",
      path: `${ADMIN_SLUG}/projects`,
      icon: <FiLayers className="w-4 h-4" />,
    },
    {
      name: "Testimonials Moderator",
      path: `${ADMIN_SLUG}/testimonials`,
      icon: <FiMessageSquare className="w-4 h-4" />,
    },
    {
      name: "Gallery Manager",
      path: `${ADMIN_SLUG}/gallery`,
      icon: <FiImage className="w-4 h-4" />,
    },
    {
      name: "Team Directory",
      path: `${ADMIN_SLUG}/team`,
      icon: <FiUsers className="w-4 h-4" />,
    },
    {
      name: "Site Settings",
      path: `${ADMIN_SLUG}/settings`,
      icon: <FiSettings className="w-4 h-4" />,
    },
  ];

  // Render minimal outlet layout directly for login route
  if (location.pathname === `${ADMIN_SLUG}/login` || !admin) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex bg-[#FFFBF5] text-[#2E2A26] font-sans antialiased">
      {/* Sidebar navigation drawer */}
      <aside className="w-64 bg-[#2E2A26] text-[#FFFBF5] flex flex-col shrink-0 border-r border-[#3D3732] shadow-xl z-20">
        {/* Brand header */}
        <div className="p-6 border-b border-[#3D3732] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500 bg-white shrink-0">
            <img src={logoImg} alt="Aditya Builders Logo" className="w-full h-full object-cover" />
          </div>
          <div className="text-left">
            <span className="font-extrabold text-sm tracking-tight text-white block">Aditya CMS</span>
            <span className="text-[10px] text-[#F5A623] font-bold block uppercase tracking-wider mt-0.5">
              {admin.role}
            </span>
          </div>
        </div>

        {/* Sidebar Navigation items */}
        <nav className="flex-grow p-4 flex flex-col gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-[#F5A623] text-white shadow-md shadow-amber-500/10"
                    : "text-[#D6CFC9] hover:bg-[#3D3732] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  {link.icon}
                  <span>{link.name}</span>
                </div>
                {link.badge !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-sm ${
                    isActive ? "bg-white text-[#2E2A26]" : "bg-[#F5A623] text-white"
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Superadmin Settings Link */}
          {admin.role === "superadmin" && (
            <Link
              to={`${ADMIN_SLUG}/admins`}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                location.pathname.startsWith(`${ADMIN_SLUG}/admins`)
                  ? "bg-[#F5A623] text-white shadow-md shadow-amber-500/10"
                  : "text-[#D6CFC9] hover:bg-[#3D3732] hover:text-white"
              }`}
            >
              <FiKey className="w-4 h-4" />
              <span>Admins (Super)</span>
            </Link>
          )}
        </nav>

        {/* Footer profile area */}
        <div className="p-4 border-t border-[#3D3732] bg-[#27231F] flex flex-col gap-3 text-left">
          <div className="px-3 py-1 bg-white/5 rounded-xl border border-white/5">
            <span className="text-[10px] text-amber-200/60 uppercase font-bold tracking-wider">
              Signed In
            </span>
            <span className="text-xs text-white block font-semibold truncate mt-0.5" title={admin.email}>
              {admin.name}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-800/15 text-red-300 hover:bg-red-800/30 rounded-xl text-xs font-bold transition-colors"
          >
            <FiLogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar panel */}
        <header className="h-16 bg-white border-b border-amber-100/50 flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-3 text-left">
            <span className="text-xs font-semibold text-[#6B625A] tracking-wider uppercase">
              Aditya Builders Portal
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm animate-pulse"></span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#E8871E] hover:text-[#F5A623] flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-amber-50/50 transition-colors"
            >
              Preview Public Site <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Main Content Grid Scroll wrapper */}
        {location.pathname.includes("/whatsapp-crm") ? (
          <main className="flex-grow overflow-hidden p-2 max-h-[calc(100vh-4rem)]">
            <Outlet />
          </main>
        ) : (
          <main className="flex-grow p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="max-w-6xl mx-auto">
              <Outlet />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
