import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FaWhatsapp } from "react-icons/fa";
import { useSiteSettings } from "../../context/SiteSettingsContext.jsx";
import { trackAnalyticsEvent } from "../../utils/analytics.js";
import { trackPixelEvent } from "../../utils/pixel.js";

// Global module-level flag to remember if the user interacted in this session session-free
let hasInteractedWithWhatsApp = false;

export default function WhatsAppFloatingButton() {
  const settings = useSiteSettings();
  const location = useLocation();
  const [pulse, setPulse] = useState(!hasInteractedWithWhatsApp);

  // If no whatsapp number exists, don't show the CTA button
  if (!settings || !settings.whatsappNumber) return null;

  // Format message depending on the current page route
  const getContextMessage = () => {
    const isProjectDetail = location.pathname.startsWith("/projects/");
    if (isProjectDetail) {
      // Decode project title from path or fallback to generic
      const pathSegments = location.pathname.split("/");
      const slug = pathSegments[pathSegments.length - 1];
      const projectTitle = slug
        ? slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
        : "a property";
      return encodeURIComponent(`Hi, I'm interested in ${projectTitle}. Please share more details.`);
    }
    return encodeURIComponent("Hi, I'm interested in Aditya Builders' projects. Please share more details.");
  };

  const handleInteraction = () => {
    hasInteractedWithWhatsApp = true;
    setPulse(false); // Stop pulse animation on interaction
  };

  const handleWhatsAppClick = () => {
    handleInteraction();
    
    // Log tracking events
    const label = location.pathname === "/" ? "hero" : location.pathname;
    trackAnalyticsEvent("whatsapp_button_clicked", "click", `float_${label}`);
    trackPixelEvent("Contact", { content_name: "whatsapp_float", value: 1 });

    const number = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${number}?text=${getContextMessage()}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.button
      onClick={handleWhatsAppClick}
      onMouseEnter={handleInteraction}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        pulse
          ? {
              scale: [1, 1.08, 1, 1.08, 1],
              opacity: 1,
              transition: {
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 5,
              },
            }
          : { scale: 1, opacity: 1 }
      }
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-xl hover:bg-[#20ba59] transition-colors focus:outline-none focus:ring-4 focus:ring-green-300"
      aria-label="Chat on WhatsApp"
    >
      <FaWhatsapp className="w-8 h-8" />
    </motion.button>
  );
}
