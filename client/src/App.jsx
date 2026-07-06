import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Public pages
import Home     from "./pages/Home.jsx";
import About    from "./pages/About.jsx";
import Projects from "./pages/Projects.jsx";
import Gallery  from "./pages/Gallery.jsx";
import Contact  from "./pages/Contact.jsx";

// Admin panel (hidden — NOT linked from any public nav/footer/sitemap)
// ⚠️  IMPORTANT: Before going live, change the slug below to something
//     long, random, and private (e.g. "/panel-a7f3d9k2m2p1").
//     The slug should ideally be sourced from an env variable at build time
//     via import.meta.env.VITE_ADMIN_SLUG.
//     NEVER expose this path in any anchor tag, sitemap, or robots.txt.
import AdminPanel from "./admin/AdminPanel.jsx";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

export default function App() {
  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "Inter, sans-serif",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#F5A623", secondary: "#fff" },
          },
        }}
      />

      <Routes>
        {/* ── Public Routes ─────────────────────────────────────────────── */}
        <Route path="/"         element={<Home />}     />
        <Route path="/about"    element={<About />}    />
        <Route path="/projects" element={<Projects />} />
        <Route path="/gallery"  element={<Gallery />}  />
        <Route path="/contact"  element={<Contact />}  />

        {/* ── Hidden Admin Panel ─────────────────────────────────────────
            This route is intentionally NOT included in the public Navbar,
            Footer, or any sitemap. Access is via the private slug only.
            Full authentication (JWT) will be added in Phase 3.
        ──────────────────────────────────────────────────────────────── */}
        <Route path={ADMIN_SLUG} element={<AdminPanel />} />

        {/* ── 404 fallback ──────────────────────────────────────────────── */}
        <Route
          path="*"
          element={
            <main className="min-h-screen flex items-center justify-center"
                  style={{ background: "var(--color-bg)" }}>
              <div className="text-center p-10">
                <p className="text-7xl font-bold font-display mb-2"
                   style={{ color: "var(--color-primary)" }}>
                  404
                </p>
                <p style={{ color: "var(--color-text-muted)" }}>
                  Page not found.{" "}
                  <a href="/" style={{ color: "var(--color-primary)" }}
                     className="underline font-medium">
                    Go home
                  </a>
                </p>
              </div>
            </main>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
