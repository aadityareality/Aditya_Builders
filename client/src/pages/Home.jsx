import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import toast from "react-hot-toast";
import {
  FiArrowRight,
  FiCheckCircle,
  FiUsers,
  FiLayers,
  FiStar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiInstagram,
  FiPlus,
  FiTrash2,
  FiAward,
  FiClock,
  FiHeart,
  FiX
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import {
  getProjects,
  getTestimonials,
  getGallery,
  submitContactForm
} from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";
import Loader from "../components/ui/Loader.jsx";
import SectionHeading from "../components/ui/SectionHeading.jsx";
import Badge from "../components/ui/Badge.jsx";
import heroBuildingImg from "../assets/hero-building.png";
import { trackAnalyticsEvent } from "../utils/analytics.js";
import { trackPixelEvent } from "../utils/pixel.js";
import CallbackModal from "../components/ui/CallbackModal.jsx";
import GalleryInquiryModal from "../components/ui/GalleryInquiryModal.jsx";

// Custom hook to animate number counts smoothly
function useCountUp(target, duration = 1.5, trigger = true) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const end = parseInt(target, 10);
    if (isNaN(end) || end <= 0) return;
    
    const totalSteps = 60;
    const stepTime = (duration * 1000) / totalSteps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const current = Math.floor(end * (progress * (2 - progress)));
      setCount(current);

      if (step >= totalSteps) {
        setCount(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, duration, trigger]);

  return count;
}

export default function Home() {
  const settings = useSiteSettings();
  const fileInputRef = useRef(null);

  // Data collections state
  const [projects, setProjects] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Interactive States
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  // Projects filter states
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Gallery filter states
  const [galleryCategory, setGalleryCategory] = useState("All");
  const [galleryLimit, setGalleryLimit] = useState(8);

  // Contact Form states
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactProject, setContactProject] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submittingContact, setSubmittingContact] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [projRes, testRes, gallRes] = await Promise.all([
          getProjects(),
          getTestimonials(),
          getGallery(),
        ]);

        if (projRes.data?.success) {
          // Store active projects
          setProjects(projRes.data.data.filter(p => p.isActive));
        }
        if (testRes.data?.success) {
          // Store approved reviews
          setTestimonials(testRes.data.data.filter(t => t.isApproved));
        }
        if (gallRes.data?.success) {
          // Store active gallery images
          setGalleryImages(gallRes.data.data.filter(img => img.isActive));
        }
      } catch (err) {
        console.error("Failed to load Homepage database contents:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // Auto rotate testimonials carousel
  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials]);

  // Clean preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  // Filters logic for Projects
  const filteredProjects = projects.filter((p) => {
    const matchesType = typeFilter === "All" || p.type === typeFilter;
    const matchesStatus = statusFilter === "All" || p.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const projectTypes = ["All", "Residential", "Commercial"];
  const projectStatuses = ["All", "Ongoing", "Completed", "Upcoming"];

  // Filters logic for Gallery
  const filteredGallery = galleryImages.filter((img) => {
    return galleryCategory === "All" || img.category === galleryCategory;
  });
  const displayedGallery = filteredGallery.slice(0, galleryLimit);
  const galleryCategories = [
    "All",
    "Construction Progress",
    "Completed Project",
    "Interior",
    "Exterior",
    "Event",
    "Other",
  ];

  // Values content
  const valuesList = [
    {
      title: "Quality Construction",
      desc: "Standard concrete mixes, high-grade steel structures, and premium ISI-marked materials built to last.",
      icon: <FiAward className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "Timely Delivery",
      desc: "Strict adherence to handover schedules. Quality + Time = Aditya guarantees timely key handovers.",
      icon: <FiClock className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "Vastu Compliance",
      desc: "Architectural floor blueprints align with traditional Indian Vastu principles for absolute positivity.",
      icon: <FiHeart className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "100% Client Trust",
      desc: "Completely transparent pricing, standard legal documentations, clear title checks, and no hidden charges.",
      icon: <FiUsers className="w-6 h-6 text-[#E8871E]" />,
    },
  ];

  // Contact Form photo selections
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > 5) {
      toast.error("You can attach up to 5 photo files maximum");
      return;
    }

    const validAttachments = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds 5MB size limit`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" has unsupported type. Use JPG, PNG, WEBP.`);
        return;
      }
      validAttachments.push({
        fileObj: file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    });

    setAttachments((prev) => [...prev, ...validAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAttachment = (idxToRemove) => {
    setAttachments((prev) => {
      const match = prev[idxToRemove];
      if (match?.previewUrl) URL.revokeObjectURL(match.previewUrl);
      return prev.filter((_, idx) => idx !== idxToRemove);
    });
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactPhone || !contactMessage) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmittingContact(true);
    const formData = new FormData();
    formData.append("name", contactName);
    formData.append("email", contactEmail);
    formData.append("phone", contactPhone);
    formData.append("message", contactMessage);
    if (contactSubject) formData.append("subject", contactSubject);
    if (contactProject) formData.append("interestedProject", contactProject);

    // Capture UTM parameters from URL query string
    const utms = new URLSearchParams(window.location.search);
    const utmSrc = utms.get("utm_source");
    const utmMed = utms.get("utm_medium");
    const utmCam = utms.get("utm_campaign");
    if (utmSrc) formData.append("utmSource", utmSrc);
    if (utmMed) formData.append("utmMedium", utmMed);
    if (utmCam) formData.append("utmCampaign", utmCam);

    attachments.forEach((att) => {
      formData.append("photos", att.fileObj);
    });

    try {
      const { data } = await submitContactForm(formData);
      if (data.success) {
        // Trigger analytics tracking events
        trackAnalyticsEvent("contact_form_submitted", "form", contactProject ? "project_enquiry" : "general");
        trackPixelEvent("Lead", { content_name: contactProject ? "project_enquiry" : "general_contact", value: 1 });

        toast.success(data.message || "Thank you! Inquiry submitted successfully.");
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setContactSubject("");
        setContactMessage("");
        setContactProject("");
        setAttachments([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmittingContact(false);
    }
  };

  // Animation sets
  const heroContainerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.15 } },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] },
    },
  };

  return (
    <>
      <Helmet>
        <title>{settings.companyName} | Premium Real Estate & Construction Bhavnagar</title>
        <meta
          name="description"
          content={`Welcome to ${settings.companyName}. ${settings.tagline}. Leading construction company in Bhavnagar, Gujarat with over ${settings.yearsOfExperience} years of experience and ${settings.happyCustomers}+ satisfied customers.`}
        />
        <link rel="canonical" href={window.location.origin} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`${settings.companyName} | Premium Real Estate & Construction Bhavnagar`} />
        <meta property="og:description" content={`Welcome to ${settings.companyName}. ${settings.tagline}. Leading property developer in Bhavnagar, Gujarat.`} />
        <meta property="og:image" content={window.location.origin + "/logo.jpg"} />
        <meta property="og:url" content={window.location.origin} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${settings.companyName} | Premium Real Estate`} />
        <meta name="twitter:description" content={`Welcome to ${settings.companyName}. Leading construction company in Bhavnagar, Gujarat.`} />
        <meta name="twitter:image" content={window.location.origin + "/logo.jpg"} />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateAgent",
            "name": settings.companyName || "Aditya Builders",
            "image": window.location.origin + "/logo.jpg",
            "description": settings.aboutUsShort || "Leading property developer and construction company in Bhavnagar, Gujarat.",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": settings.address || "Jewels Circle",
              "addressLocality": "Bhavnagar",
              "addressRegion": "Gujarat",
              "postalCode": "364001",
              "addressCountry": "IN"
            },
            "geo": settings.mapLatitude && settings.mapLongitude ? {
              "@type": "GeoCoordinates",
              "latitude": settings.mapLatitude,
              "longitude": settings.mapLongitude
            } : undefined,
            "telephone": settings.phoneNumbers?.[0] || "",
            "url": window.location.origin,
            "priceRange": "₹₹",
            "openingHoursSpecification": {
              "@type": "OpeningHoursSpecification",
              "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
              ],
              "opens": "09:00",
              "closes": "19:00"
            }
          })}
        </script>
      </Helmet>

      {/* Lightbox Overlay */}
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
              alt="Full view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO SECTION ─── */}
      <section
        id="home"
        className="relative min-h-[85vh] sm:min-h-screen flex items-center overflow-hidden py-20 text-left bg-[#2E2A26]"
      >
        {/* Hero Background image eager loaded */}
        <img
          src={heroBuildingImg}
          alt="Aditya Builders premium residential building exterior"
          className="absolute inset-0 w-full h-full object-cover object-center sm:object-right z-0 select-none pointer-events-none"
          loading="eager"
        />

        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#2E2A26] via-[#2E2A26]/80 to-transparent z-10" />
        <div className="absolute inset-0 bg-[#F5A623]/10 mix-blend-overlay z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
          <motion.div
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7 flex flex-col items-start"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-block px-4 py-1.5 rounded-full text-[10px] font-bold bg-[#F5A623]/20 text-[#F5A623] border border-[#F5A623]/35 mb-6 uppercase tracking-wider">
                ✦ Shaping Bhavnagar's Skyline Since 2011
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 font-display text-white leading-[1.1]"
            >
              Constructing Spaces Built On{" "}
              <span className="text-[#F5A623]">Quality & Trust</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-[#F5A623] text-sm sm:text-base font-bold font-display tracking-wider mb-6 uppercase"
            >
              {settings.tagline}
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-xs sm:text-sm text-gray-300/90 mb-8 leading-relaxed max-w-xl"
            >
              {settings.aboutUsShort}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <a href="#projects">
                <Button variant="primary">Explore Projects →</Button>
              </a>
              <a href="#contact">
                <Button variant="outlineWhite">Contact Sales</Button>
              </a>
              <Button
                variant="outlineWhite"
                onClick={() => {
                  trackAnalyticsEvent("phone_number_clicked", "click", "home_hero_callback");
                  setCallbackOpen(true);
                }}
              >
                Request Call Back 📞
              </Button>
            </motion.div>
          </motion.div>


        </div>
      </section>

      {/* ─── STATISTICS STRIP ─── */}
      <section className="bg-white border-b border-amber-100 py-12 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-6 text-center md:max-w-4xl md:mx-auto">
            <div>
              <span className="text-3xl sm:text-5xl font-extrabold text-[#E8871E] font-display block">
                {useCountUp(settings.yearsOfExperience)}+
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#6B625A] uppercase tracking-wider mt-1 block">
                Years Experience
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-5xl font-extrabold text-[#E8871E] font-display block">
                {useCountUp(settings.happyCustomers)}+
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#6B625A] uppercase tracking-wider mt-1 block">
                Happy Customers
              </span>
            </div>
            <div>
              <span className="text-3xl sm:text-5xl font-extrabold text-[#E8871E] font-display block">
                {useCountUp(settings.projectsCompleted || 15)}+
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-[#6B625A] uppercase tracking-wider mt-1 block">
                Completed Projects
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ABOUT SECTION (SCROLL TARGET) ─── */}
      <section id="about" className="py-20 bg-white text-left scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
            <div className="lg:col-span-7 flex flex-col gap-6">
              <SectionHeading
                title="Shaping Landmarks Built on Quality & Trust"
                subtitle="About Our Journey"
                align="left"
                className="mb-4"
              />
              <p className="text-sm text-[#6B625A] leading-relaxed whitespace-pre-line">
                {settings.aboutUsFull}
              </p>
              <div className="mt-4">
                <Link to="/about">
                  <Button variant="secondary">Meet The Team & Board Directors →</Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#FFFBF5] border border-amber-100 rounded-3xl p-8 shadow-sm flex flex-col gap-6 select-none">
              <h3 className="text-base font-bold font-display text-[#2E2A26] border-b border-amber-150 pb-2.5">
                Standard Guarantee
              </h3>
              <div className="flex flex-col gap-4 text-xs text-[#6B625A]">
                <span className="flex items-center gap-2.5 font-semibold">
                  <FiCheckCircle className="text-[#F5A623] w-4.5 h-4.5 shrink-0" /> 100% Transparent Deals
                </span>
                <span className="flex items-center gap-2.5 font-semibold">
                  <FiCheckCircle className="text-[#F5A623] w-4.5 h-4.5 shrink-0" /> ISI Grade Raw Materials
                </span>
                <span className="flex items-center gap-2.5 font-semibold">
                  <FiCheckCircle className="text-[#F5A623] w-4.5 h-4.5 shrink-0" /> Certified Structural Architects
                </span>
                <span className="flex items-center gap-2.5 font-semibold">
                  <FiCheckCircle className="text-[#F5A623] w-4.5 h-4.5 shrink-0" /> Real-time Construction Tracking
                </span>
              </div>
            </div>
          </div>

          {/* Company Values block list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-amber-50">
            {valuesList.map((v, idx) => (
              <Card key={idx} className="flex flex-col gap-4 h-full">
                <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                  {v.icon}
                </div>
                <h4 className="font-bold text-[#2E2A26] font-display text-sm">{v.title}</h4>
                <p className="text-xs text-[#6B625A] leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROJECTS SECTION (SCROLL TARGET) ─── */}
      <section id="projects" className="py-20 bg-[#FFFBF5] border-y border-amber-100/30 text-left scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Our Signature Residential & Commercial Ventures"
            subtitle="Projects Portfolio"
            align="center"
          />

          {/* Type + Status Filters bar */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-12 border-b border-amber-100/50 pb-8 select-none">
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

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <span className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">Status Selection</span>
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
            <div className="text-center py-16 bg-white border border-dashed border-amber-200 rounded-3xl p-6 select-none">
              <span className="text-3xl">🏢</span>
              <h3 className="font-extrabold text-[#2E2A26] text-sm mt-3">No matching ventures listed</h3>
              <p className="text-xs text-[#6B625A] mt-1 max-w-xs mx-auto">
                No active properties match your filters. Check our complete list using the button below.
              </p>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((p) => (
                  <motion.div
                    layout
                    key={p._id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
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
                      
                      <div className="mb-3 bg-[#FFFBF5] rounded-xl border border-amber-50/55 p-3 flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#6B625A]">Price:</span>
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
                        <Link to={`/projects/${p.slug}`} className="font-bold text-[#E8871E] hover:underline">
                          More Details →
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="mt-12 text-center">
            <Link to="/projects">
              <Button variant="secondary">View Complete Spec Catalogs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white text-center select-none overflow-hidden border-b border-amber-100/30">
          <div className="max-w-4xl mx-auto px-4">
            <SectionHeading
              title="Words From Our Homeowners"
              subtitle="Client Testimonials"
              align="center"
            />

            <div className="relative h-64 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeReviewIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center max-w-2xl"
                >
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {Array.from({ length: testimonials[activeReviewIndex].rating }).map((_, i) => (
                      <FiStar key={i} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-base sm:text-lg italic text-[#6B625A] leading-relaxed mb-6">
                    "{testimonials[activeReviewIndex].message}"
                  </p>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#2E2A26]">
                    — {testimonials[activeReviewIndex].customerName}
                    {testimonials[activeReviewIndex].projectName && (
                      <span className="text-[#E8871E] block mt-1 font-semibold text-[10px]">
                        Owner, {testimonials[activeReviewIndex].projectName}
                      </span>
                    )}
                  </h4>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveReviewIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    idx === activeReviewIndex ? "w-6 bg-[#E8871E]" : "bg-amber-200"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── GALLERY SECTION (SCROLL TARGET) ─── */}
      <section id="gallery" className="py-20 bg-[#FFFBF5] text-left scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Glimpses Of Completed & Ongoing Builds"
            subtitle="Photo Gallery"
            align="center"
          />

          {/* Category Tabs list */}
          <div className="flex flex-wrap gap-2 justify-center mb-12 border-b border-amber-100/50 pb-8 select-none">
            {galleryCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setGalleryCategory(cat);
                  setGalleryLimit(8); // reset pagination
                }}
                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  galleryCategory === cat
                    ? "bg-[#E8871E] text-white border-transparent shadow-sm"
                    : "bg-white text-[#6B625A] border-amber-100 hover:bg-amber-50/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <Loader size="sm" />
          ) : filteredGallery.length === 0 ? (
            <p className="text-xs text-center text-[#6B625A]">No images matching this category.</p>
          ) : (
            <>
              <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {displayedGallery.map((img) => (
                    <motion.div
                      layout
                      key={img._id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm bg-white border border-amber-100/50 cursor-pointer"
                      onClick={() => setSelectedGalleryImage({
                        url: img.image?.url,
                        publicId: img.image?.publicId,
                        title: img.title,
                        category: img.category
                      })}
                    >
                      <img
                        src={img.image?.url || "https://placehold.co/400x400/FAC354/FFFFFF?text=Aditya+Build"}
                        alt={img.title || "Aditya Build"}
                        className="w-full h-full object-contain bg-[#FFFBF5]/80 group-hover:scale-103 transition-transform duration-300"
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

              {filteredGallery.length > galleryLimit && (
                <div className="mt-12 text-center select-none">
                  <Button variant="secondary" onClick={() => setGalleryLimit(prev => prev + 8)}>
                    Load More Photos
                  </Button>
                </div>
              )}
            </>
          )}

          <div className="mt-12 text-center">
            <Link to="/gallery">
              <Button variant="secondary">View Full Screen Album</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CONTACT SECTION (SCROLL TARGET) ─── */}
      <section id="contact" className="py-20 bg-white border-t border-amber-100/50 text-left scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Get In Touch With Sales Representatives"
            subtitle="Connect Us"
            align="center"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-12">
            {/* Left side details */}
            <div className="lg:col-span-5 flex flex-col gap-6 select-none">
              <div className="flex gap-4 items-start bg-[#FFFBF5] p-5 rounded-2xl border border-amber-100/40 shadow-xs">
                <FiMapPin className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] text-xs uppercase tracking-wider mb-1">Office Location</h4>
                  <p className="text-xs text-[#6B625A] leading-relaxed">{settings.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-[#FFFBF5] p-5 rounded-2xl border border-amber-100/40 shadow-xs">
                <FiPhone className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] text-xs uppercase tracking-wider mb-1">Call Sales</h4>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {settings.phoneNumbers &&
                      settings.phoneNumbers.map((num) => (
                        <a key={num} href={`tel:${num.replace(/\s+/g, "")}`} className="hover:text-[#E8871E] font-bold text-xs">
                          {num}
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-[#FFFBF5] p-5 rounded-2xl border border-amber-100/40 shadow-xs">
                <FiMail className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] text-xs uppercase tracking-wider mb-1">General Support</h4>
                  <a href={`mailto:${settings.email}`} className="hover:text-[#E8871E] font-bold text-xs break-all">
                    {settings.email}
                  </a>
                </div>
              </div>

              {/* Whatsapp / Instagram links */}
              <div className="flex gap-4 items-center bg-[#FFFBF5] rounded-2xl p-5 border border-amber-100/35 text-xs text-[#6B625A]">
                <span className="font-bold uppercase tracking-wider">Socials:</span>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center hover:bg-[#F5A623] hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <FiInstagram className="w-4.5 h-4.5" />
                </a>
                {settings.whatsappNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-white border border-amber-100 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                    aria-label="WhatsApp"
                  >
                    <FaWhatsapp className="w-4.5 h-4.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Right side form */}
            <div className="lg:col-span-7 bg-[#FFFBF5] border border-amber-100 rounded-3xl p-8 shadow-xs flex flex-col gap-6">
              <form onSubmit={handleContactSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Parth Parmar"
                      className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. parth@gmail.com"
                      className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +91 99748 58500"
                      className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="e.g. Site Visit"
                      className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
                    />
                  </div>
                </div>

                {projects.length > 0 && (
                  <div>
                    <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Interested Project</label>
                    <select
                      value={contactProject}
                      onChange={(e) => setContactProject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26]"
                    >
                      <option value="">Select Project</option>
                      {projects.map((p) => (
                        <option key={p._id} value={p._id}>{p.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Provide your villa configuration requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26] resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="block text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">Photo Attachments (Optional)</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-amber-100 hover:border-[#F5A623] rounded-2xl p-6 bg-white flex flex-col items-center justify-center cursor-pointer transition-colors text-center select-none"
                  >
                    <FiPlus className="w-5 h-5 text-[#E8871E] mb-1.5" />
                    <span className="text-xs font-bold text-[#2E2A26]">Add Reference Images</span>
                    <span className="text-[8px] text-[#6B625A]/60 mt-0.5">JPG, PNG, WEBP (Max 5 images, 5MB each)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2.5 mt-2 select-none">
                      {attachments.map((att, idx) => (
                        <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-amber-100 bg-white group">
                          <img src={att.previewUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(idx)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          >
                            <FiTrash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={submittingContact} className="py-4 justify-center w-full mt-2">
                  {submittingContact ? "Submitting Inquiry..." : "Submit Inquiry"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA BANNER ─── */}
      <section className="py-20 bg-gradient-to-tr from-[#2E2A26] to-[#47403B] text-white text-center select-none">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display mb-4">
            Build Your Dream Space With Us
          </h2>
          <p className="text-xs sm:text-sm text-[#A3988F] leading-relaxed max-w-xl mb-8">
            Consult with our engineering and floor planners to design vastu-compliant custom villas across Bhavnagar, Gujarat.
          </p>
          <a href="#contact">
            <Button variant="primary" className="shadow-lg shadow-orange-500/5">
              Contact Sales Experts <FiArrowRight />
            </Button>
          </a>
        </div>
      </section>

      <CallbackModal
        isOpen={callbackOpen}
        onClose={() => setCallbackOpen(false)}
      />

      <GalleryInquiryModal
        isOpen={!!selectedGalleryImage}
        onClose={() => setSelectedGalleryImage(null)}
        image={selectedGalleryImage}
      />
    </>
  );
}
