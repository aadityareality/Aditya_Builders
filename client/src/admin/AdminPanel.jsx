/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ADMIN PANEL — SECURITY NOTICE                                          ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  This component is served at a PRIVATE URL slug stored in .env          ║
 * ║  (ADMIN_PANEL_SLUG). The slug used in App.jsx MUST be changed to a      ║
 * ║  long, random, unguessable string before going live.                    ║
 * ║                                                                         ║
 * ║  ⚠️  NEVER link to this page from:                                      ║
 * ║     • Public navigation (Navbar, Footer)                                ║
 * ║     • Sitemap (robots.txt / sitemap.xml)                               ║
 * ║     • Any public-facing HTML or anchor tag                             ║
 * ║                                                                         ║
 * ║  Full JWT-authenticated admin dashboard will be built in Phase 3.       ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
export default function AdminPanel() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#1a1a2e", color: "#e2e8f0" }}
    >
      <div className="text-center p-10 max-w-md">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold font-display mb-2" style={{ color: "#F5A623" }}>
          Admin Panel
        </h1>
        <p className="text-sm opacity-60 mb-4">
          Aditya Builders — Secure Administration Area
        </p>
        <p className="text-xs opacity-40 border border-gray-700 rounded-lg p-3">
          Phase 3: JWT authentication, project management, gallery uploads,
          and contact lead management will be built here.
        </p>
      </div>
    </main>
  );
}
