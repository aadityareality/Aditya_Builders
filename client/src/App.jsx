import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SiteSettingsProvider } from "./context/SiteSettingsContext.jsx";

// Public Layout Wrapper
import Layout from "./components/layout/Layout.jsx";

// Public pages (Eager loaded for immediate access by prospective buyers)
import Home          from "./pages/Home.jsx";
import About         from "./pages/About.jsx";
import Projects      from "./pages/Projects.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import Gallery       from "./pages/Gallery.jsx";
import Contact       from "./pages/Contact.jsx";
import NotFound      from "./pages/NotFound.jsx";

// Loader UI component
import Loader from "./components/ui/Loader.jsx";

// Admin CMS Components & Routing Layout (Lazy loaded to separate administration assets)
const AdminLayout         = lazy(() => import("./admin/AdminLayout.jsx"));
const ProtectedAdminRoute = lazy(() => import("./admin/components/ProtectedAdminRoute.jsx"));

// Admin CMS Pages
const AdminLogin        = lazy(() => import("./admin/pages/AdminLogin.jsx"));
const Leads             = lazy(() => import("./admin/pages/Leads.jsx"));
const LeadDetail        = lazy(() => import("./admin/pages/LeadDetail.jsx"));
const AdminProjects     = lazy(() => import("./admin/pages/AdminProjects.jsx"));
const ProjectForm       = lazy(() => import("./admin/pages/ProjectForm.jsx"));
const AdminTestimonials = lazy(() => import("./admin/pages/AdminTestimonials.jsx"));
const AdminGallery      = lazy(() => import("./admin/pages/AdminGallery.jsx"));
const AdminTeam         = lazy(() => import("./admin/pages/AdminTeam.jsx"));
const AdminSettings     = lazy(() => import("./admin/pages/AdminSettings.jsx"));
const AdminUsers        = lazy(() => import("./admin/pages/AdminUsers.jsx"));
const AdminAppointments = lazy(() => import("./admin/pages/AdminAppointments.jsx"));
const WhatsAppCRM       = lazy(() => import("./admin/pages/WhatsAppCRM.jsx"));
const ChatAnalytics     = lazy(() => import("./admin/pages/ChatAnalytics.jsx"));
const WhatsAppBroadcast = lazy(() => import("./admin/pages/WhatsAppBroadcast.jsx"));

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

import { trackPageView } from "./utils/analytics.js";

// Component to handle smooth scroll on hash links across routes
function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    // Track Pageview on GA4
    trackPageView(pathname + hash);

    if (hash) {
      const element = document.getElementById(hash.slice(1));
      if (element) {
        // Wait briefly for content rendering
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 120);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hash, pathname]);

  return null;
}

export default function App() {
  const adminSuspenseFallback = (
    <div className="flex flex-col gap-3 justify-center items-center h-screen bg-[#FFFBF5] text-[#6B625A]">
      <Loader size="md" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8871E] animate-pulse">
        Loading Panel Assets...
      </span>
    </div>
  );

  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToHash />
        <AuthProvider>
          <SiteSettingsProvider>
            {/* Global toast notifications styling */}
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontFamily: "Outfit, sans-serif",
                  fontSize: "0.875rem",
                  borderRadius: "12px",
                  border: "1px solid #fff3e0",
                  background: "#fffbf5",
                  color: "#2e2a26",
                },
                success: {
                  iconTheme: { primary: "#F5A623", secondary: "#fff" },
                },
              }}
            />

            <Routes>
              {/* ── Public Routes (wrapped in Outlets Layout) ────────────────── */}
              <Route path="/" element={<Layout />}>
                <Route index                   element={<Home />} />
                <Route path="about"            element={<About />} />
                <Route path="projects"         element={<Projects />} />
                <Route path="projects/:slug"   element={<ProjectDetail />} />
                <Route path="gallery"          element={<Gallery />} />
                <Route path="contact"          element={<Contact />} />
                
                {/* Public 404 fallback page */}
                <Route path="*"                element={<NotFound />} />
              </Route>

              {/* ── Hidden Admin Panel (nested layout routes with Suspense) ── */}
              <Route
                path={ADMIN_SLUG}
                element={
                  <Suspense fallback={adminSuspenseFallback}>
                    <AdminLayout />
                  </Suspense>
                }
              >
                {/* Public within admin tree: login page */}
                <Route path="login" element={<AdminLogin />} />

                {/* Secure pages */}
                <Route
                  index
                  element={
                    <ProtectedAdminRoute>
                      <Navigate to={`${ADMIN_SLUG}/leads`} replace />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="leads"
                  element={
                    <ProtectedAdminRoute>
                      <Leads />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="appointments"
                  element={
                    <ProtectedAdminRoute>
                      <AdminAppointments />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="leads/:id"
                  element={
                    <ProtectedAdminRoute>
                      <LeadDetail />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="projects"
                  element={
                    <ProtectedAdminRoute>
                      <AdminProjects />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="projects/new"
                  element={
                    <ProtectedAdminRoute>
                      <ProjectForm />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="projects/:id/edit"
                  element={
                    <ProtectedAdminRoute>
                      <ProjectForm />
                    </ProtectedAdminRoute>
                  }
                />
                
                <Route
                  path="testimonials"
                  element={
                    <ProtectedAdminRoute>
                      <AdminTestimonials />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="gallery"
                  element={
                    <ProtectedAdminRoute>
                      <AdminGallery />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="team"
                  element={
                    <ProtectedAdminRoute>
                      <AdminTeam />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <ProtectedAdminRoute>
                      <AdminSettings />
                    </ProtectedAdminRoute>
                  }
                />
                
                {/* Superadmin restricted page */}
                <Route
                  path="admins"
                  element={
                    <ProtectedAdminRoute requireSuperadmin>
                      <AdminUsers />
                    </ProtectedAdminRoute>
                  }
                />

                {/* WhatsApp CRM Live Chat Dashboard */}
                <Route
                  path="whatsapp-crm"
                  element={
                    <ProtectedAdminRoute>
                      <WhatsAppCRM />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="chat-analytics"
                  element={
                    <ProtectedAdminRoute>
                      <ChatAnalytics />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="broadcast"
                  element={
                    <ProtectedAdminRoute>
                      <WhatsAppBroadcast />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Catch-all within admin panel, redirect to leads inbox */}
                <Route path="*" element={<Navigate to={`${ADMIN_SLUG}/leads`} replace />} />
              </Route>
            </Routes>
          </SiteSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}
