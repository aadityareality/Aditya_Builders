import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { FiMapPin, FiPhone, FiInfo, FiTag, FiKey, FiAward, FiX } from "react-icons/fi";
import { getProjectBySlug } from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Button from "../components/ui/Button.jsx";
import Loader from "../components/ui/Loader.jsx";
import Badge from "../components/ui/Badge.jsx";

export default function ProjectDetail() {
  const settings = useSiteSettings();
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePhotoUrl, setActivePhotoUrl] = useState(null);

  // Lightbox index state
  const [lightboxUrl, setLightboxUrl] = useState(null);

  useEffect(() => {
    async function loadProjectDetails() {
      setLoading(true);
      try {
        const { data } = await getProjectBySlug(slug);
        if (data.success && data.data) {
          setProject(data.data);
          if (data.data.coverImage?.url) {
            setActivePhotoUrl(data.data.coverImage.url);
          }
        }
      } catch (err) {
        console.error("Failed to load project details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjectDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 bg-[#FFFBF5]">
        <span className="text-5xl">🏘️</span>
        <h2 className="text-2xl font-bold font-display text-[#2E2A26] mt-4">Project Not Found</h2>
        <p className="text-xs text-[#6B625A] mt-1 max-w-sm">
          We couldn't locate any active projects matching the address slug "{slug}". It may have been archived by the administrator.
        </p>
        <Link to="/projects" className="mt-6">
          <Button variant="primary">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // Combine cover image and gallery images for layout
  const allImages = [];
  if (project.coverImage?.url) allImages.push(project.coverImage.url);
  if (project.gallery && Array.isArray(project.gallery)) {
    project.gallery.forEach((g) => {
      if (g.url) allImages.push(g.url);
    });
  }

  return (
    <>
      <Helmet>
        <title>{project.title} | Projects | {settings.companyName}</title>
        <meta
          name="description"
          content={`Explore details, amenities, configuration, and floor designs for ${project.title} located at ${project.location} in Bhavnagar, Gujarat.`}
        />
        <link rel="canonical" href={`${window.location.origin}/projects/${slug}`} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`${project.title} | Projects | ${settings.companyName}`} />
        <meta property="og:description" content={`Explore details, configuration and amenities for ${project.title} in Bhavnagar, Gujarat.`} />
        <meta property="og:image" content={project.coverImage?.url || ""} />
        <meta property="og:url" content={`${window.location.origin}/projects/${slug}`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${project.title} | ${settings.companyName}`} />
        <meta name="twitter:description" content={`Explore details and designs for ${project.title} in Bhavnagar, Gujarat.`} />
        <meta name="twitter:image" content={project.coverImage?.url || ""} />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": project.title,
            "description": project.description,
            "image": project.coverImage?.url || "",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": project.location,
              "addressLocality": "Bhavnagar",
              "addressRegion": "Gujarat",
              "addressCountry": "IN"
            },
            "offers": {
              "@type": "AggregateOffer",
              "priceCurrency": "INR",
              "lowPrice": project.startingPrice || "Contact for Price"
            }
          })}
        </script>
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
              alt="Lightbox View"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Details Body */}
      <section className="py-12 bg-[#FFFBF5] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs navigation */}
          <div className="flex gap-2 text-xs text-[#6B625A] mb-8 font-semibold select-none">
            <Link to="/" className="hover:text-[#E8871E]">Home</Link>
            <span>/</span>
            <Link to="/projects" className="hover:text-[#E8871E]">Projects</Link>
            <span>/</span>
            <span className="text-[#2E2A26]">{project.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left Column: Photo Showcase */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {activePhotoUrl && (
                <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-amber-100/50 shadow-sm bg-amber-50 relative group">
                  <img src={activePhotoUrl} alt={project.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => setLightboxUrl(activePhotoUrl)}
                    className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold cursor-zoom-in"
                  >
                    Click to Enlarge 🔍
                  </button>
                </div>
              )}

              {/* Thumbnails list */}
              {allImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 select-none">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoUrl(imgUrl)}
                      className={`w-20 h-16 rounded-xl overflow-hidden border shrink-0 transition-all ${
                        activePhotoUrl === imgUrl
                          ? "border-[#E8871E] ring-2 ring-amber-100 scale-102"
                          : "border-amber-100 hover:border-amber-200"
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Spec sheet Details */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Header Title & Status */}
              <div className="flex flex-col gap-2 items-start">
                <Badge status={project.status} />
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-[#2E2A26]">
                  {project.title}
                </h1>
                <span className="text-[#E8871E] font-bold font-display text-sm uppercase">
                  {project.type} Property
                </span>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-[#6B625A] leading-relaxed">
                {project.description}
              </p>

              {/* Specification table */}
              <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm select-none">
                <h3 className="font-bold text-[#2E2A26] font-display text-xs uppercase tracking-wider mb-4 border-b border-amber-50 pb-2">
                  Specification Details
                </h3>
                <div className="flex flex-col gap-3.5 text-xs text-[#6B625A]">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium"><FiMapPin className="text-[#F5A623]" /> Location</span>
                    <span className="font-bold text-[#2E2A26]">{project.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium"><FiInfo className="text-[#F5A623]" /> Configuration</span>
                    <span className="font-bold text-[#2E2A26]">{project.configuration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium"><FiTag className="text-[#F5A623]" /> Price Estimate</span>
                    <span className="font-bold text-[#E8871E]">{project.startingPrice || "Request Quote"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-medium"><FiKey className="text-[#F5A623]" /> Possession Date</span>
                    <span className="font-bold text-[#2E2A26]">{project.possessionDate || "TBA"}</span>
                  </div>
                  {project.reraNumber && (
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1.5 font-medium"><FiAward className="text-[#F5A623]" /> RERA Registered</span>
                      <span className="font-bold text-green-600 bg-green-50 border border-green-100 px-2.5 py-0.5 rounded text-[10px]">
                        {project.reraNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Enquiry Box CTA */}
              <div className="bg-gradient-to-tr from-[#2E2A26] to-[#3D3732] text-white rounded-2xl p-5 border border-amber-900/10 shadow-sm flex flex-col gap-4 text-center items-center">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-amber-400">Interested in {project.title}?</h4>
                  <p className="text-[10px] text-[#A3988F] mt-1 max-w-xs leading-relaxed">
                    Get floor blueprints, pricing plans, and site visits scheduled with our Bhavnagar sales representatives.
                  </p>
                </div>
                <Link to={`/contact?project=${project._id}`} className="w-full">
                  <Button variant="primary" className="w-full">
                    Enquire Now <FiPhone />
                  </Button>
                </Link>
              </div>

            </div>

          </div>

          {/* Amenities details list */}
          {project.amenities && project.amenities.length > 0 && (
            <div className="mt-16 border-t border-amber-100/50 pt-12">
              <h3 className="text-xl font-bold font-display text-[#2E2A26] mb-8">
                Premium Amenities Provided
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 select-none">
                {project.amenities.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white border border-amber-100 flex items-center gap-3 hover:shadow-xs transition-shadow shadow-sm"
                  >
                    <span className="text-lg">✦</span>
                    <span className="text-xs font-bold text-[#6B625A]">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>
    </>
  );
}
