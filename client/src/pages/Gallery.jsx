import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiLayers } from "react-icons/fi";
import { getGallery } from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Loader from "../components/ui/Loader.jsx";
import Button from "../components/ui/Button.jsx";
import SectionHeading from "../components/ui/SectionHeading.jsx";

export default function Gallery() {
  const settings = useSiteSettings();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Lightbox modal url
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Pagination count limit
  const [displayCount, setDisplayCount] = useState(12);

  useEffect(() => {
    async function loadGalleryData() {
      try {
        const { data } = await getGallery();
        if (data.success) {
          // Filter out active images only
          setImages(data.data.filter(img => img.isActive));
        }
      } catch (err) {
        console.error("Failed to load gallery items:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGalleryData();
  }, []);

  const categories = [
    "All",
    "Construction Progress",
    "Completed Project",
    "Interior",
    "Exterior",
    "Event",
    "Other",
  ];

  // Filtering images client-side
  const filteredImages = images.filter((img) => {
    return categoryFilter === "All" || img.category === categoryFilter;
  });

  const displayedImages = filteredImages.slice(0, displayCount);

  return (
    <>
      <Helmet>
        <title>Portfolio Gallery Showcase | {settings.companyName}</title>
        <meta
          name="description"
          content={`Browse photos of interior designs, exterior finishes, construction site progress, and completed layout locations by ${settings.companyName} in Bhavnagar, Gujarat.`}
        />
        <link rel="canonical" href={`${window.location.origin}/gallery`} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`Portfolio Gallery Showcase | ${settings.companyName}`} />
        <meta property="og:description" content={`Browse photos of interior designs, exterior finishes, and construction site progress in Bhavnagar, Gujarat.`} />
        <meta property="og:image" content={window.location.origin + "/logo.jpg"} />
        <meta property="og:url" content={`${window.location.origin}/gallery`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Portfolio Gallery Showcase | ${settings.companyName}`} />
        <meta name="twitter:description" content={`Browse completed projects album and construction sites by ${settings.companyName}.`} />
        <meta name="twitter:image" content={window.location.origin + "/logo.jpg"} />
      </Helmet>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out select-none"
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightboxUrl}
              alt="Lightbox Fullscreen View"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Banner */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100/40 py-16 border-b border-amber-100 text-left select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8871E] mb-2 bg-[#F5A623]/10 px-3 py-1 rounded-full border border-[#F5A623]/25 w-max block">
            Media
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#2E2A26] mt-2">
            Gallery Showcase
          </h1>
        </div>
      </section>

      {/* Gallery Showcase Content */}
      <section className="py-16 bg-[#FFFBF5] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Category Tabs list */}
          <div className="flex flex-wrap gap-2 justify-center mb-12 border-b border-amber-100/50 pb-8 select-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategoryFilter(cat);
                  setDisplayCount(12); // Reset count on filter change
                }}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  categoryFilter === cat
                    ? "bg-[#E8871E] text-white border-transparent shadow-sm"
                    : "bg-white text-[#6B625A] border-amber-100 hover:bg-amber-50/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader size="md" />
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-amber-200 rounded-3xl p-8 select-none">
              <span className="text-4xl">📸</span>
              <h3 className="font-extrabold text-[#2E2A26] text-base mt-4">No photos uploaded yet</h3>
              <p className="text-xs text-[#6B625A] mt-1 max-w-xs mx-auto">
                There are currently no images cataloged under the category "{categoryFilter}". Check back again soon.
              </p>
            </div>
          ) : (
            <>
              {/* Responsive Grid layout */}
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayedImages.map((img) => (
                    <motion.div
                      layout
                      key={img._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm bg-white border border-amber-100/50 cursor-pointer"
                      onClick={() => setLightboxUrl(img.image?.url)}
                    >
                      <img
                        src={img.image?.url || "https://placehold.co/400x400/FAC354/FFFFFF?text=Aditya+Build"}
                        alt={img.title || "Gallery Spotlight"}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-left select-none">
                        <span className="text-white font-bold text-xs">{img.title || "Aditya Build"}</span>
                        <span className="text-amber-300 text-[8px] uppercase font-bold tracking-wider mt-0.5">{img.category}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Load More pagination button */}
              {filteredImages.length > displayCount && (
                <div className="mt-12 text-center select-none">
                  <Button variant="secondary" onClick={() => setDisplayCount((prev) => prev + 12)}>
                    Load More Photos
                  </Button>
                </div>
              )}
            </>
          )}

        </div>
      </section>
    </>
  );
}
