import { useState, useEffect } from "react";
import api from "../../hooks/api.js";
import ImageUpload from "../components/ImageUpload.jsx";
import toast from "react-hot-toast";
import { FiSave, FiInfo, FiMapPin, FiLayers, FiPhone, FiMail, FiShare2, FiHelpCircle } from "react-icons/fi";

/**
 * AdminSettings Component
 * Single form bound to the SiteSettings singleton document.
 */
export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    aboutUsShort: "",
    aboutUsFull: "",
    yearsOfExperience: 15,
    happyCustomers: 1000,
    projectsCompleted: 0,
    address: "",
    phoneNumbers: "",
    email: "",
    instagramUrl: "",
    facebookUrl: "",
    whatsappNumber: "",
    mapLatitude: "",
    mapLongitude: "",
    logoUrl: "",
    logoPublicId: "",
    officeHours: "",
  });

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/settings");
      if (data.success && data.data) {
        const s = data.data;
        setFormData({
          companyName: s.companyName || "",
          tagline: s.tagline || "",
          aboutUsShort: s.aboutUsShort || "",
          aboutUsFull: s.aboutUsFull || "",
          yearsOfExperience: s.yearsOfExperience || 15,
          happyCustomers: s.happyCustomers || 1000,
          projectsCompleted: s.projectsCompleted || 0,
          address: s.address || "",
          phoneNumbers: s.phoneNumbers?.join(", ") || "",
          email: s.email || "",
          instagramUrl: s.instagramUrl || "",
          facebookUrl: s.facebookUrl || "",
          whatsappNumber: s.whatsappNumber || "",
          mapLatitude: s.mapLatitude !== null && s.mapLatitude !== undefined ? s.mapLatitude : "",
          mapLongitude: s.mapLongitude !== null && s.mapLongitude !== undefined ? s.mapLongitude : "",
          logoUrl: s.logo?.url || "",
          logoPublicId: s.logo?.publicId || "",
          officeHours: s.officeHours || "",
        });
        setLogoFile(null);
      }
    } catch {
      toast.error("Failed to load global site settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim()) return toast.error("Company name is required");
    if (!formData.email.trim()) return toast.error("Enquiry email is required");

    setSaving(true);

    const fd = new FormData();
    fd.append("companyName", formData.companyName);
    fd.append("tagline", formData.tagline);
    fd.append("aboutUsShort", formData.aboutUsShort);
    fd.append("aboutUsFull", formData.aboutUsFull);
    fd.append("yearsOfExperience", formData.yearsOfExperience);
    fd.append("happyCustomers", formData.happyCustomers);
    fd.append("projectsCompleted", formData.projectsCompleted);
    fd.append("address", formData.address);
    fd.append("email", formData.email);
    fd.append("instagramUrl", formData.instagramUrl);
    fd.append("facebookUrl", formData.facebookUrl);
    fd.append("whatsappNumber", formData.whatsappNumber);
    fd.append("mapLatitude", formData.mapLatitude);
    fd.append("mapLongitude", formData.mapLongitude);
    fd.append("officeHours", formData.officeHours);

    const numbersArray = formData.phoneNumbers ? formData.phoneNumbers.split(",").map((i) => i.trim()).filter(Boolean) : [];
    fd.append("phoneNumbers", JSON.stringify(numbersArray));

    if (logoFile) {
      fd.append("logo", logoFile);
    } else {
      fd.append("logo", JSON.stringify({ url: formData.logoUrl, publicId: formData.logoPublicId }));
    }

    try {
      const { data } = await api.patch("/admin/settings", fd);
      if (data.success) {
        toast.success("Global settings saved successfully");
        setLogoFile(null);
        loadSettingsData();
      }
    } catch {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 bg-white border border-amber-100/60 rounded-2xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5A623]"></div>
      </div>
    );
  }

  return (
    <div className="text-left flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-amber-100 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-[#2E2A26]">Site Settings</h2>
          <p className="text-xs text-[#6B625A] mt-1">Configure company descriptions, contacts, logos, and maps.</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        {/* Row 1: Company Info & About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Branding & About */}
            <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
              <h3 className="text-sm font-bold text-[#2E2A26] flex items-center gap-2 border-b border-amber-50 pb-2">
                <FiInfo className="text-[#E8871E]" /> Company Info & Marketing
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                    Official Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Aditya Builders"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs font-bold text-[#2E2A26]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                    Marketing Tagline *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                    placeholder="e.g. Quality | Trust"
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/20 text-xs text-[#2E2A26]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Short Introduction (Homepage Preview Section)
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.aboutUsShort}
                  onChange={(e) => setFormData({ ...formData, aboutUsShort: e.target.value })}
                  placeholder="Aditya Builders is a trusted developer..."
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Full Story (About Page Details Content)
                </label>
                <textarea
                  rows={5}
                  required
                  value={formData.aboutUsFull}
                  onChange={(e) => setFormData({ ...formData, aboutUsFull: e.target.value })}
                  placeholder="Tell your clients about your company roots, principles..."
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 focus:outline-none focus:border-[#F5A623] bg-[#FFFBF5]/25 text-xs text-[#2E2A26] resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Save & Branding */}
          <div className="flex flex-col gap-6">
            {/* Save Card */}
            <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full btn-primary justify-center text-xs py-3.5 flex items-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <FiSave className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save Site Settings"}
              </button>
              <p className="text-[10px] text-[#6B625A]/60 text-center leading-normal">
                Updating site settings changes footer text and contact details globally instantly.
              </p>
            </div>

            {/* Logo upload widget */}
            <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
              <ImageUpload
                label="Site Corporate Logo Upload"
                value={formData.logoUrl}
                onChange={(file, previewUrl) => {
                  setLogoFile(file);
                  setFormData((prev) => ({ ...prev, logoUrl: previewUrl }));
                }}
              />
            </div>
          </div>
        </div>

        {/* Row 2: Stats, Contact details, Socials, Coordinates */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-[#2E2A26] flex items-center gap-2 border-b border-[#FFFBF5] pb-2">
              <FiLayers className="text-[#E8871E]" /> Performance Stats
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                required
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Happy Customers Served
              </label>
              <input
                type="number"
                required
                value={formData.happyCustomers}
                onChange={(e) => setFormData({ ...formData, happyCustomers: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Delivered Projects Milestone Count
              </label>
              <input
                type="number"
                required
                value={formData.projectsCompleted}
                onChange={(e) => setFormData({ ...formData, projectsCompleted: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-[#2E2A26] flex items-center gap-2 border-b border-[#FFFBF5] pb-2">
              <FiPhone className="text-[#E8871E]" /> Office Contacts
            </h3>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Enquiry Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="info@adityabuilders.in"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Phone Numbers (comma-separated list)
              </label>
              <input
                type="text"
                required
                value={formData.phoneNumbers}
                onChange={(e) => setFormData({ ...formData, phoneNumbers: e.target.value })}
                placeholder="+91 99748 58500, +91 99748 58501"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Office Physical Address
              </label>
              <textarea
                rows={2}
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Plot no 3, Jewels Circle, Bhavnagar"
                className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                Office Operating Hours
              </label>
              <input
                type="text"
                required
                value={formData.officeHours}
                onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                placeholder="e.g. Mon-Sat: 9:30 AM - 7:00 PM"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>
          </div>

          {/* Socials & Maps Coordinates */}
          <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4 text-xs">
            <h3 className="text-sm font-bold text-[#2E2A26] flex items-center gap-2 border-b border-[#FFFBF5] pb-2">
              <FiShare2 className="text-[#E8871E]" /> Socials & Coordinates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Instagram Url
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                  Facebook Url
                </label>
                <input
                  type="url"
                  value={formData.facebookUrl}
                  onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider mb-2">
                WhatsApp Phone Link
              </label>
              <input
                type="text"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="919974858500 (include country code)"
                className="w-full px-4 py-2.5 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold"
              />
            </div>

            {/* Coordinates Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[10px] font-bold text-[#6B625A] uppercase tracking-wider">
                  Office GPS Coordinates
                </label>
                <span
                  className="text-[9px] text-[#E8871E] font-bold flex items-center gap-0.5 hover:underline cursor-help select-none"
                  title="Right-click your location on Google Maps to copy the Latitude and Longitude values."
                >
                  <FiHelpCircle /> Where to get?
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.000001"
                  value={formData.mapLatitude}
                  onChange={(e) => setFormData({ ...formData, mapLatitude: e.target.value })}
                  placeholder="Latitude (e.g. 21.76)"
                  className="w-full px-3 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold text-xs"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={formData.mapLongitude}
                  onChange={(e) => setFormData({ ...formData, mapLongitude: e.target.value })}
                  placeholder="Longitude (e.g. 72.15)"
                  className="w-full px-3 py-2 rounded-xl border border-amber-100 focus:outline-none bg-[#FFFBF5]/20 font-semibold text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
