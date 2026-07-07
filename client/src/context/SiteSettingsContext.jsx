import { createContext, useContext, useState, useEffect } from "react";
import { getSettings } from "../services/api.js";

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await getSettings();
        if (data.success && data.data) {
          setSettings(data.data);
        }
      } catch (err) {
        console.error("Failed to load initial site settings from CMS:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFBF5]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-[#F5A623] mb-4"></div>
        <p className="text-sm font-bold tracking-wide font-display text-[#E8871E] animate-pulse uppercase">
          Aditya Builders
        </p>
      </div>
    );
  }

  // Provide settings globally. If settings failed to load, provide fallback defaults.
  const fallbackSettings = {
    companyName: "Aditya Builders",
    tagline: "You Dream it, We Build it. Quality + Time = Aditya",
    aboutUsShort: "Trusted construction & real estate based in Bhavnagar, Gujarat.",
    aboutUsFull: "Aditya Builders has been shaping the skyline of Bhavnagar, Gujarat for over 15 years.",
    yearsOfExperience: 15,
    happyCustomers: 1000,
    projectsCompleted: 15,
    address: "Plot no 3, Shivomnagar, Jewels Circle to RTO Road, Bhavnagar 364004, Gujarat",
    phoneNumbers: ["+91 99748 58500"],
    email: "parthrajsinhparmar4115@gmail.com",
    instagramUrl: "https://instagram.com/adityabuilders_",
    whatsappNumber: "919974858500",
    mapLatitude: 21.75979,
    mapLongitude: 72.12433,
    mapEmbedUrl: "https://www.google.com/maps?q=21.75979,72.12433&output=embed",
  };

  const finalSettings = settings || fallbackSettings;

  return (
    <SiteSettingsContext.Provider value={finalSettings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error("useSiteSettings must be used within a SiteSettingsProvider");
  }
  return context;
}
