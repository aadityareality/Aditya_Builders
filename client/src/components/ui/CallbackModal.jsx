import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPhone, FiUser, FiClock, FiCheckCircle } from "react-icons/fi";
import { submitCallbackRequest } from "../../services/api.js";
import { trackAnalyticsEvent } from "../../utils/analytics.js";
import { trackPixelEvent } from "../../utils/pixel.js";
import toast from "react-hot-toast";

export default function CallbackModal({ isOpen, onClose, projectId = null, projectTitle = "" }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState("Anytime");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      toast.error("Please fill in your name and phone number");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        phone,
        preferredTime,
        relatedProject: projectId,
      };

      const { data } = await submitCallbackRequest(payload);
      if (data.success) {
        // Trigger analytics tracking events
        trackAnalyticsEvent("callback_requested", "form", projectId ? `project_${projectTitle.toLowerCase().replace(/\s+/g, "_")}` : "general");
        trackPixelEvent("Lead", { content_name: "callback_request", value: 1 });

        setSuccess(true);
        toast.success(data.message || "Callback request sent!");
        setTimeout(() => {
          handleClose();
        }, 2500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setPhone("");
    setPreferredTime("Anytime");
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
            className="fixed inset-0 bg-black/55 backdrop-blur-xs"
          />

          {/* Modal Container Card */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative bg-white border border-amber-100/70 w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 text-left overflow-hidden"
          >
            {/* Header Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#6B625A] hover:text-[#2E2A26] transition-colors p-1.5 rounded-full hover:bg-amber-50"
            >
              <FiX className="w-5 h-5" />
            </button>

            {!success ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <span className="text-[9px] font-extrabold text-[#F5A623] uppercase tracking-widest block mb-1">
                    Quick Contact
                  </span>
                  <h3 className="text-lg font-bold text-[#2E2A26] font-display">
                    Request a Call Back
                  </h3>
                  <p className="text-[11px] text-[#6B625A]/70 mt-1">
                    Leave your details and our team will get in touch with you shortly.
                  </p>
                  {projectTitle && (
                    <span className="inline-block bg-amber-50 border border-amber-100 text-[#E8871E] font-bold text-[9px] px-2.5 py-0.5 rounded-md mt-2">
                      Interested in: {projectTitle}
                    </span>
                  )}
                </div>

                {/* Name Field */}
                <div className="flex flex-col gap-1.5">
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
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26]"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 99748 58500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26]"
                    />
                  </div>
                </div>

                {/* Preferred Time Field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-[#6B625A] uppercase tracking-wider">
                    Preferred Time to Call
                  </label>
                  <div className="relative">
                    <FiClock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F5A623]" />
                    <select
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-white text-xs text-[#2E2A26] cursor-pointer"
                    >
                      <option value="Anytime">Anytime (During business hours)</option>
                      <option value="Morning">Morning (9:00 AM - 12:00 PM)</option>
                      <option value="Afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                      <option value="Evening">Evening (4:00 PM - 7:00 PM)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#E8871E] hover:bg-[#D4861A] text-white font-bold py-3.5 px-6 rounded-xl transition-all text-xs text-center shadow-md shadow-amber-500/10 active:scale-[0.98] select-none flex items-center justify-center gap-2 mt-2"
                >
                  <FiPhone className="w-3.5 h-3.5" />
                  {submitting ? "Sending Request..." : "Request Call Back"}
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-10 text-center gap-4"
              >
                <FiCheckCircle className="w-16 h-16 text-green-500 animate-bounce" />
                <div>
                  <h4 className="text-base font-bold text-[#2E2A26] font-display">
                    Request Received!
                  </h4>
                  <p className="text-xs text-[#6B625A]/80 mt-1 max-w-xs leading-relaxed">
                    Thank you, <strong>{name}</strong>. Our sales representative will call you back on your number <strong>{phone}</strong> shortly.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
