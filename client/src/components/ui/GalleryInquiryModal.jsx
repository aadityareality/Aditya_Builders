import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPhone, FiUser, FiMail, FiMessageSquare, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { useSiteSettings } from "../../context/SiteSettingsContext.jsx";
import { submitContactForm } from "../../services/api.js";
import { trackAnalyticsEvent } from "../../utils/analytics.js";
import { trackPixelEvent } from "../../utils/pixel.js";
import toast from "react-hot-toast";

export default function GalleryInquiryModal({ isOpen, onClose, image }) {
  const settings = useSiteSettings();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);



  // Pre-fill message when image changes
  useEffect(() => {
    if (image && image.title) {
      setMessage(`Hi, I'm interested in this design (Reference: "${image.title}"). Please share pricing and details.`);
    }
  }, [image]);

  if (!image) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("message", message);
      formData.append("subject", `Design Inquiry: ${image.title}`);

      // Pass the reference image metadata to the backend uploader
      const refImgData = {
        url: image.url,
        publicId: image.publicId || "gallery-ref"
      };
      formData.append("referenceImage", JSON.stringify(refImgData));

      // Capture UTM parameters from URL query string
      const utms = new URLSearchParams(window.location.search);
      const utmSrc = utms.get("utm_source");
      const utmMed = utms.get("utm_medium");
      const utmCam = utms.get("utm_campaign");
      if (utmSrc) formData.append("utmSource", utmSrc);
      if (utmMed) formData.append("utmMedium", utmMed);
      if (utmCam) formData.append("utmCampaign", utmCam);

      const { data } = await submitContactForm(formData);
      if (data.success) {
        // Trigger analytics tracking events
        trackAnalyticsEvent("gallery_inquiry_submitted", "form", image.title);
        trackPixelEvent("Lead", { content_name: "gallery_inquiry", value: 1 });

        setSuccess(true);
        toast.success("Inquiry sent successfully!");
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white w-full max-w-4xl h-full max-h-[90vh] md:max-h-[80vh] rounded-3xl shadow-2xl z-10 overflow-hidden flex flex-col md:flex-row text-left"
          >
            {/* Header Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white md:text-[#6B625A] bg-black/40 md:bg-amber-50 hover:bg-black/60 md:hover:bg-amber-100 transition-colors p-2 rounded-full z-20 focus:outline-none"
            >
              <FiX className="w-5 h-5" />
            </button>

            {/* Left Column: Image Viewer (50% on desktop) */}
            <div className="w-full md:w-1/2 h-48 md:h-full bg-amber-50 relative shrink-0">
              <img
                src={image.url}
                alt={image.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="bg-[#F5A623] text-black font-extrabold text-[9px] px-2.5 py-1 rounded-md uppercase tracking-wider w-max mb-2 shadow-sm">
                  {image.category}
                </span>
                <h4 className="text-base sm:text-lg font-extrabold font-display leading-tight drop-shadow-sm">
                  {image.title}
                </h4>
              </div>
            </div>

            {/* Right Column: Inquiry Form (50% on desktop) */}
            <div className="w-full md:w-1/2 h-[calc(100%-12rem)] md:h-full overflow-y-auto p-6 md:p-8 flex flex-col gap-5 justify-center">
              {!success ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <span className="text-[9px] font-extrabold text-[#F5A623] uppercase tracking-widest block mb-1">
                      Design Spotlight
                    </span>
                    <h3 className="text-lg font-bold text-[#2E2A26] font-display leading-tight">
                      Inquire About This Design
                    </h3>
                    <p className="text-[11px] text-[#6B625A]/70 mt-1.5 leading-relaxed">
                      Love this concept? Enter your contact details and our construction experts will share structural blueprints, layout maps, and customized price estimates.
                    </p>
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                      Full Name *
                    </label>
                    <div className="relative">
                      <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]" />
                      <input
                        type="text"
                        required
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26]"
                      />
                    </div>
                  </div>

                  {/* Contact channels fields row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                        Email Address *
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. user@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. +91 99748 58500"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message field */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                      Message *
                    </label>
                    <div className="relative">
                      <FiMessageSquare className="absolute left-3.5 top-3.5 text-[#F5A623]" />
                      <textarea
                        required
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="I would like to get a quote and details about this design..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className={`grid ${settings?.whatsappNumber ? "grid-cols-2" : "grid-cols-1"} gap-3 mt-1`}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#E8871E] hover:bg-[#D4861A] text-white font-bold py-3 px-4 rounded-xl transition-all text-xs text-center shadow-md shadow-amber-500/10 active:scale-[0.98] select-none flex items-center justify-center gap-2"
                    >
                      <FiMail className="w-3.5 h-3.5" />
                      {submitting ? "Sending..." : "Submit Inquiry"}
                    </button>

                    {settings?.whatsappNumber && (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded-xl transition-all text-xs text-center shadow-md shadow-green-500/10 active:scale-[0.98] select-none flex items-center justify-center gap-2"
                      >
                        <FaWhatsapp className="w-4 h-4" /> {submitting ? "Sending..." : "Enquire on WhatsApp"}
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center gap-4 py-6"
                >
                  <FiCheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                  <div>
                    <h4 className="text-base font-bold text-[#2E2A26] font-display">
                      Inquiry Dispatched!
                    </h4>
                    <p className="text-xs text-[#6B625A]/80 mt-1 max-w-xs leading-relaxed">
                      Thank you! Our engineering managers will review your reference design query for <strong>"{image.title}"</strong> and contact you with design options shortly.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
