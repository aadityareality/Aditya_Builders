import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiMapPin, FiPhone, FiMail, FiInstagram, FiPlus, FiTrash2, FiClock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { submitContactForm, getProjects } from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Button from "../components/ui/Button.jsx";
import SectionHeading from "../components/ui/SectionHeading.jsx";
import { trackAnalyticsEvent } from "../utils/analytics.js";
import { trackPixelEvent } from "../utils/pixel.js";

export default function Contact() {
  const settings = useSiteSettings();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  // Load projects list to display project name when query matches
  const [projectsList, setProjectsList] = useState([]);
  const [targetProjectName, setTargetProjectName] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [interestedProject, setInterestedProject] = useState("");

  // Attachment states (stores array of file objects)
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadProjectsForDropdown() {
      try {
        const { data } = await getProjects();
        if (data.success) {
          const list = data.data.filter(p => p.isActive);
          setProjectsList(list);

          // Check if arriving from project detail query
          const pId = searchParams.get("project");
          if (pId) {
            setInterestedProject(pId);
            const match = list.find((p) => p._id === pId);
            if (match) {
              setTargetProjectName(match.title);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load projects list in contact:", err);
      }
    }
    loadProjectsForDropdown();
  }, [searchParams]);

  // Handle file selections
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // Check file limits (max 5 files total)
    if (attachments.length + files.length > 5) {
      toast.error("You can attach up to 5 photo files maximum");
      return;
    }

    const validAttachments = [];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

    files.forEach((file) => {
      // Size check (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the 5MB size limit`);
        return;
      }

      // Format check
      if (!allowedTypes.includes(file.type)) {
        toast.error(`"${file.name}" has an unsupported image format. Only JPG, PNG, WEBP are accepted.`);
        return;
      }

      // Generate preview URL
      validAttachments.push({
        fileObj: file,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
      });
    });

    setAttachments((prev) => [...prev, ...validAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment preview
  const handleRemoveAttachment = (indexToRemove) => {
    setAttachments((prev) => {
      const match = prev[indexToRemove];
      if (match?.previewUrl) {
        URL.revokeObjectURL(match.previewUrl);
      }
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // Clean preview URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      });
    };
  }, [attachments]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("message", message);
    if (subject) formData.append("subject", subject);
    if (interestedProject) formData.append("interestedProject", interestedProject);

    // Capture UTM parameters from URL query string
    const utms = new URLSearchParams(window.location.search);
    const utmSrc = utms.get("utm_source");
    const utmMed = utms.get("utm_medium");
    const utmCam = utms.get("utm_campaign");
    if (utmSrc) formData.append("utmSource", utmSrc);
    if (utmMed) formData.append("utmMedium", utmMed);
    if (utmCam) formData.append("utmCampaign", utmCam);

    // Append attachments arrays (key matches multer router expects: 'photos')
    attachments.forEach((att) => {
      formData.append("photos", att.fileObj);
    });

    try {
      const { data } = await submitContactForm(formData);
      if (data.success) {
        // Trigger analytics tracking events
        trackAnalyticsEvent("contact_form_submitted", "form", interestedProject ? "project_enquiry" : "general");
        trackPixelEvent("Lead", { content_name: interestedProject ? "project_enquiry" : "general_contact", value: 1 });

        toast.success(data.message || "Thank you! We'll get back to you shortly.");
        
        // Reset state values
        setName("");
        setEmail("");
        setPhone("");
        setSubject("");
        setMessage("");
        setInterestedProject("");
        setTargetProjectName(null);
        setAttachments([]);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to submit enquiry form. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedProjectTitle = () => {
    if (targetProjectName) return targetProjectName;
    if (interestedProject && projectsList.length > 0) {
      const match = projectsList.find((p) => p._id === interestedProject);
      return match ? match.title : "";
    }
    return "";
  };

  const handleWhatsAppEnquiry = (e) => {
    e.preventDefault();
    const projectTitle = getSelectedProjectTitle();

    const details = [
      `*Name:* ${name.trim() || "N/A"}`,
      `*Email:* ${email.trim() || "N/A"}`,
      `*Phone:* ${phone.trim() || "N/A"}`,
      subject.trim() ? `*Subject:* ${subject.trim()}` : null,
      projectTitle ? `*Project:* ${projectTitle}` : null,
      message.trim() ? `*Message:* ${message.trim()}` : null,
    ].filter(Boolean).join("\n");

    const text = `Hi, I would like to submit an enquiry:\n\n${details}`;
    const number = settings?.whatsappNumber?.replace(/[^0-9]/g, "") || "919974858500";
    const waUrl = `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

    trackAnalyticsEvent("whatsapp_button_clicked", "click", "contact_form_footer");
    trackPixelEvent("Contact", { content_name: "whatsapp_footer", value: 1 });

    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <Helmet>
        <title>Contact Sales & Support | {settings.companyName}</title>
        <meta
          name="description"
          content={`Get in touch with ${settings.companyName} at Bhavnagar, Gujarat. Schedule site visits, enquire about price lists, or upload reference photo templates.`}
        />
        <link rel="canonical" href={`${window.location.origin}/contact`} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`Contact Sales & Support | ${settings.companyName}`} />
        <meta property="og:description" content={`Get in touch with ${settings.companyName} in Bhavnagar, Gujarat. Schedule site visits or enquire about price lists.`} />
        <meta property="og:image" content={window.location.origin + "/logo.jpg"} />
        <meta property="og:url" content={`${window.location.origin}/contact`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`Contact Sales & Support | ${settings.companyName}`} />
        <meta name="twitter:description" content={`Enquire about residential and commercial sites by ${settings.companyName} in Bhavnagar.`} />
        <meta name="twitter:image" content={window.location.origin + "/logo.jpg"} />
      </Helmet>

      {/* Title Banner */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100/40 py-16 border-b border-amber-100 text-left select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8871E] mb-2 bg-[#F5A623]/10 px-3 py-1 rounded-full border border-[#F5A623]/25 w-max block">
            Support
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#2E2A26] mt-2">
            Get In Touch
          </h1>
        </div>
      </section>

      {/* Main Form/Details Columns */}
      <section className="py-20 bg-[#FFFBF5] text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Contact details specifications */}
          <div className="lg:col-span-5 flex flex-col gap-8 select-none">
            <div>
              <h3 className="text-2xl font-extrabold font-display text-[#2E2A26] mb-3">
                Headquarters
              </h3>
              <p className="text-xs sm:text-sm text-[#6B625A] leading-relaxed">
                Visit our office or call us directly during corporate working hours (9:00 AM — 7:00 PM, Sunday Closed) to review floor blueprints and contract catalogs.
              </p>
            </div>

            <div className="flex flex-col gap-5 text-xs sm:text-sm text-[#6B625A]">
              <div className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-100/50 shadow-xs">
                <FiMapPin className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] mb-1">Office Address</h4>
                  <p className="leading-relaxed">{settings.address}</p>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-100/50 shadow-xs">
                <FiPhone className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] mb-1">Call Us</h4>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {settings.phoneNumbers &&
                      settings.phoneNumbers.map((num) => (
                        <a
                          key={num}
                          href={`tel:${num.replace(/\s+/g, "")}`}
                          onClick={() => {
                            trackAnalyticsEvent("phone_number_clicked", "click", "contact_page");
                            trackPixelEvent("Contact", { content_name: "phone_click", value: 1 });
                          }}
                          className="hover:text-[#E8871E] font-bold"
                        >
                          {num}
                        </a>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-100/50 shadow-xs">
                <FiMail className="text-[#F5A623] w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-[#2E2A26] mb-1">Email Us</h4>
                  <a
                    href={`mailto:${settings.email}`}
                    onClick={() => {
                      trackAnalyticsEvent("email_link_clicked", "click", "contact_page");
                    }}
                    className="hover:text-[#E8871E] font-bold mt-1 block break-all"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              {settings.whatsappNumber && (
                <div className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-amber-100/50 shadow-xs">
                  <FaWhatsapp className="text-[#25D366] w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-[#2E2A26] mb-1">WhatsApp Chat</h4>
                    <a
                      href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi, I'm interested in Aditya Builders' projects. Please share more details.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        trackAnalyticsEvent("whatsapp_button_clicked", "click", "contact_inline");
                        trackPixelEvent("Contact", { content_name: "whatsapp_inline", value: 1 });
                      }}
                      className="hover:text-[#E8871E] font-bold mt-1 block"
                    >
                      Chat with Sales Representative →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Social connection handles */}
            <div className="flex gap-4 items-center bg-[#FFFBF5] rounded-2xl p-5 border border-amber-100/30">
              <span className="text-xs font-bold text-[#6B625A] uppercase tracking-wider">Social Channels:</span>
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex items-center justify-center hover:bg-[#F5A623] hover:text-white transition-colors"
                aria-label="Instagram Profile"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              {settings.whatsappNumber && (
                <a
                  href={`https://wa.me/${settings.whatsappNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-white border border-amber-100 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors"
                  aria-label="WhatsApp Connect"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Right Column: Submission Form */}
          <div className="lg:col-span-7 bg-white border border-amber-100 rounded-3xl p-8 shadow-sm flex flex-col gap-6">
            <h3 className="text-xl font-bold font-display text-[#2E2A26]">
              Send Us a Message
            </h3>

            {targetProjectName && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex justify-between items-center text-xs">
                <span className="font-bold text-[#E8871E]">Enquiring about: {targetProjectName}</span>
                <button
                  onClick={() => {
                    setInterestedProject("");
                    setTargetProjectName(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 font-bold"
                  title="Clear Project Reference"
                >
                  Clear X
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Parthraj Parmar"
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. parth@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 99748 58500"
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Subject (Optional)</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Pricing Query"
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  />
                </div>
              </div>

              {/* Projects dropdown list if not pre-locked */}
              {!targetProjectName && projectsList.length > 0 && (
                <div>
                  <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Interested Project (Optional)</label>
                  <select
                    value={interestedProject}
                    onChange={(e) => setInterestedProject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  >
                    <option value="">Select Project</option>
                    {projectsList.map((p) => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us about your villa requirements or site visit request details..."
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs resize-none text-[#2E2A26] leading-relaxed"
                />
              </div>

              {/* Multi-Photo attachments upload panel */}
              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider">Photo Attachments (Optional)</label>
                
                {/* File picker drop area styling */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-amber-100 hover:border-[#F5A623] rounded-2xl p-6 bg-[#FFFBF5]/25 flex flex-col items-center justify-center cursor-pointer transition-colors text-center select-none"
                >
                  <FiPlus className="w-6 h-6 text-[#E8871E] mb-2" />
                  <span className="text-xs font-bold text-[#2E2A26]">Click to upload reference photos</span>
                  <span className="text-[9px] text-[#6B625A]/60 mt-1">Accepts up to 5 JPG/PNG/WEBP images (Max 5MB each)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* File preview thumbnails panel */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3 select-none">
                    {attachments.map((att, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-amber-100 shadow-sm bg-amber-50 group">
                        <img src={att.previewUrl} alt={`Attachment ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          title="Remove Photo"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`grid ${settings?.whatsappNumber ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-3 mt-2`}>
                <Button type="submit" disabled={submitting} className="py-4 justify-center w-full">
                  {submitting ? "Sending..." : "Submit Inquiry"}
                </Button>

                {settings?.whatsappNumber && (
                  <button
                    type="button"
                    onClick={handleWhatsAppEnquiry}
                    className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-4 px-6 rounded-2xl transition-all text-xs text-center shadow-md shadow-green-500/10 active:scale-[0.98] select-none flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    <FaWhatsapp className="w-4 h-4" /> Enquire on WhatsApp
                  </button>
                )}
              </div>
            </form>
          </div>

        </div>
      </section>
    </>
  );
}
