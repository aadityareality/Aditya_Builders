import fs from "fs";
import path from "path";

const domain = "https://adityabuilders.in";
const staticPages = [
  "",
  "/about",
  "/projects",
  "/gallery",
  "/contact"
];

async function generate() {
  console.log("🌐 Generating sitemap.xml...");
  let projects = [];
  
  try {
    const apiUrl = process.env.VITE_API_URL || "http://localhost:5000/api";
    // Increase timeout or ignore errors to ensure build safety
    const response = await fetch(`${apiUrl}/projects`, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) {
      projects = data.data;
      console.log(`📊 Fetched ${projects.length} active projects for sitemap.`);
    }
  } catch (err) {
    console.warn("⚠️ Could not fetch projects from live API during build. Generating sitemap with static routes only.");
    console.warn(`   Reason: ${err.message}`);
  }

  const currentDate = new Date().toISOString().split("T")[0];

  const xmlItems = [
    ...staticPages.map(page => `  <url>
    <loc>${domain}${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page === "" ? "1.0" : "0.8"}</priority>
  </url>`),
    ...projects.map(p => `  <url>
    <loc>${domain}/projects/${p.slug}</loc>
    <lastmod>${p.updatedAt ? p.updatedAt.split("T")[0] : currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`)
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems.join("\n")}
</urlset>`;

  const publicDir = path.resolve("public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemapXml, "utf8");
  console.log("✅ sitemap.xml generated successfully in client/public/sitemap.xml");
}

generate();
