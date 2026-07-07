import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects } from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Card from "../components/ui/Card.jsx";
import Loader from "../components/ui/Loader.jsx";
import SectionHeading from "../components/ui/SectionHeading.jsx";
import Badge from "../components/ui/Badge.jsx";

export default function Projects() {
  const settings = useSiteSettings();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    async function loadProjectsList() {
      try {
        const { data } = await getProjects();
        if (data.success) {
          // Filter to show active projects only
          setProjects(data.data.filter(p => p.isActive));
        }
      } catch (err) {
        console.error("Failed to load projects list:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjectsList();
  }, []);

  // Filter projects logic client-side for smoother transition animations
  const filteredProjects = projects.filter((p) => {
    const matchesType = typeFilter === "All" || p.type === typeFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const projectTypes = ["All", "Residential", "Commercial"];
  const projectStatuses = ["All", "Ongoing", "Completed", "Upcoming"];

  return (
    <>
      <Helmet>
        <title>Residential & Commercial Projects | {settings.companyName}</title>
        <meta
          name="description"
          content={`Browse residential and commercial layouts from ${settings.companyName} in Bhavnagar, Gujarat. Ongoing, Completed and Upcoming properties.`}
        />
        <link rel="canonical" href={`${window.location.origin}/projects`} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`Residential & Commercial Projects | ${settings.companyName}`} />
        <meta property="og:description" content={`Browse residential and commercial layouts from ${settings.companyName} in Bhavnagar, Gujarat.`} />
        <meta property="og:image" content={window.location.origin + "/logo.jpg"} />
        <meta property="og:url" content={`${window.location.origin}/projects`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Residential & Commercial Projects | ${settings.companyName}`} />
        <meta name="twitter:description" content={`Explore properties from ${settings.companyName} in Bhavnagar, Gujarat.`} />
        <meta name="twitter:image" content={window.location.origin + "/logo.jpg"} />
      </Helmet>

      {/* Title Banner */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100/40 py-16 border-b border-amber-100 text-left select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8871E] mb-2 bg-[#F5A623]/10 px-3 py-1 rounded-full border border-[#F5A623]/25 w-max block">
            Portfolio
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#2E2A26] mt-2">
            Residential & Commercial Landmarks
          </h1>
        </div>
      </section>

      {/* Main projects grid view */}
      <section className="py-16 bg-[#FFFBF5] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Filters controls bar */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-12 border-b border-amber-100/50 pb-8 select-none">
            {/* Type filters */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">Property Type</span>
              <div className="flex flex-wrap gap-2">
                {projectTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      typeFilter === type
                        ? "bg-[#E8871E] text-white border-transparent shadow-sm"
                        : "bg-white text-[#6B625A] border-amber-100 hover:bg-amber-50/50"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filters */}
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <span className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">Construction Status</span>
              <div className="flex flex-wrap gap-2">
                {projectStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      statusFilter === status
                        ? "bg-[#E8871E] text-white border-transparent shadow-sm"
                        : "bg-white text-[#6B625A] border-amber-100 hover:bg-amber-50/50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <Loader size="md" />
          ) : filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white border border-dashed border-amber-200 rounded-3xl p-8"
            >
              <span className="text-4xl">🏢</span>
              <h3 className="font-extrabold text-[#2E2A26] text-base mt-4">No matching properties found</h3>
              <p className="text-xs text-[#6B625A] mt-1 max-w-sm mx-auto">
                We couldn't find any projects matching your current filter selections. Try resetting the filters.
              </p>
              <button
                onClick={() => {
                  setTypeFilter("All");
                  setStatusFilter("All");
                }}
                className="mt-5 text-xs font-bold text-[#E8871E] underline cursor-pointer hover:text-[#F5A623]"
              >
                Reset Filters
              </button>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((p) => (
                  <motion.div
                    layout
                    key={p._id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="flex flex-col h-full overflow-hidden text-left relative">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-amber-50/20 border border-amber-100/50 mb-5 relative group">
                        {/* Ambient blurred backdrop */}
                        <img
                          src={p.coverImage?.url || "https://placehold.co/600x450/F5A623/FFFFFF?text=Aditya+Project"}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110 opacity-30 pointer-events-none"
                        />
                        {/* Clean contained image */}
                        <img
                          src={p.coverImage?.url || "https://placehold.co/600x450/F5A623/FFFFFF?text=Aditya+Project"}
                          alt={p.title}
                          className="w-full h-full object-contain relative z-10"
                          loading="lazy"
                        />
                        <Badge status={p.status} className="absolute top-3 left-3 z-20 shadow-sm" />
                      </div>
                      <h3 className="text-lg font-bold font-display text-[#2E2A26] mb-1">{p.title}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#E8871E] mb-3 block">
                        {p.type} • {p.configuration}
                      </span>
                      <p className="text-xs text-[#6B625A] leading-relaxed line-clamp-3 mb-5">
                        {p.description}
                      </p>
                      
                      {/* Pricing strip */}
                      <div className="mb-3 bg-[#FFFBF5] rounded-xl border border-amber-50/50 p-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#6B625A]">Starting Price:</span>
                        <span className="font-extrabold text-[#E8871E] font-display">{p.startingPrice || "Request Quote"}</span>
                      </div>

                      {/* Saleable Area strip */}
                      {p.saleableArea?.minSqFt && (
                        <div className="mb-5 bg-amber-50/40 rounded-xl border border-amber-100/40 p-3 flex justify-between items-center text-xs">
                          <span className="font-semibold text-[#6B625A]">Saleable Area:</span>
                          <span className="font-bold text-[#2E2A26]">
                            {p.saleableArea.maxSqFt
                              ? `${p.saleableArea.minSqFt} – ${p.saleableArea.maxSqFt} sq.ft`
                              : `${p.saleableArea.minSqFt} sq.ft`}
                          </span>
                        </div>
                      )}

                      <div className="mt-auto pt-4 border-t border-amber-50 flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#6B625A]">{p.location}</span>
                        <Link to={`/projects/${p.slug}`} className="font-bold text-[#E8871E] hover:underline flex items-center gap-1">
                          Details →
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </section>
    </>
  );
}
