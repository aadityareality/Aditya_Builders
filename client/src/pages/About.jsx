import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FiAward, FiUsers, FiClock, FiHeart } from "react-icons/fi";
import { getTeam } from "../services/api.js";
import { useSiteSettings } from "../context/SiteSettingsContext.jsx";
import Card from "../components/ui/Card.jsx";
import Loader from "../components/ui/Loader.jsx";
import SectionHeading from "../components/ui/SectionHeading.jsx";

export default function About() {
  const settings = useSiteSettings();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const { data } = await getTeam();
        if (data.success) {
          // Filter to show active team members only
          setTeam(data.data.filter(member => member.isActive));
        }
      } catch (err) {
        console.error("Failed to load staff bios:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAboutData();
  }, []);

  const values = [
    {
      title: "Quality Construction",
      desc: "We use premium ISI-marked materials, high-grade steel, and standard concrete mixes to construct load-bearing structures that stand for generations.",
      icon: <FiAward className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "Timely Delivery",
      desc: "Our formula Quality + Time = Aditya guarantees possession handovers strictly per agreed schedules, avoiding delays and financial cost overruns.",
      icon: <FiClock className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "Vastu Compliance",
      desc: "Every villa, apartment, and layout design is curated alongside traditional Vastu principles, ensuring positive energy and alignment.",
      icon: <FiHeart className="w-6 h-6 text-[#E8871E]" />,
    },
    {
      title: "Client Transparency",
      desc: "We practice transparent dealings, maintaining detailed documentations, clear title checks, and straight forward contract pricing.",
      icon: <FiUsers className="w-6 h-6 text-[#E8871E]" />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>About Us | {settings.companyName}</title>
        <meta
          name="description"
          content={`Learn about the journey and values of ${settings.companyName}. Based in Bhavnagar, Gujarat with ${settings.yearsOfExperience} years of construction excellence.`}
        />
        <link rel="canonical" href={`${window.location.origin}/about`} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={`About Us | ${settings.companyName}`} />
        <meta property="og:description" content={`Learn about the journey and values of ${settings.companyName} in Bhavnagar, Gujarat.`} />
        <meta property="og:image" content={window.location.origin + "/logo.jpg"} />
        <meta property="og:url" content={`${window.location.origin}/about`} />
        <meta property="og:type" content="website" />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`About Us | ${settings.companyName}`} />
        <meta name="twitter:description" content={`Learn about the construction excellence of ${settings.companyName} in Bhavnagar.`} />
        <meta name="twitter:image" content={window.location.origin + "/logo.jpg"} />
      </Helmet>

      {/* ─── Page Title Banner ─── */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-100/40 py-16 border-b border-amber-100 text-left select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#E8871E] mb-2 bg-[#F5A623]/10 px-3 py-1 rounded-full border border-[#F5A623]/25 w-max block">
            Aditya Builders
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display text-[#2E2A26] mt-2">
            Our Legacy & Story
          </h1>
        </div>
      </section>

      {/* ─── Corporate Story ─── */}
      <section className="py-20 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#2E2A26]">
              Shaping Saurashtra's Real Estate Landscape
            </h2>
            <p className="text-sm text-[#6B625A] leading-relaxed whitespace-pre-line">
              {settings.aboutUsFull}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-[#FFFBF5] border border-amber-100 rounded-3xl p-8 shadow-sm flex flex-col gap-8 select-none"
          >
            <h3 className="text-lg font-bold font-display text-[#2E2A26] border-b border-amber-100/50 pb-4">
              Why Aditya Builders?
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-[#E8871E] font-display">
                  {settings.yearsOfExperience}+
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B625A] mt-1">
                  Years of trust
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-[#E8871E] font-display">
                  {settings.happyCustomers}+
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B625A] mt-1">
                  Happy Homeowners
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-[#E8871E] font-display">
                  {settings.projectsCompleted || 5}+
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B625A] mt-1">
                  Delivered Layouts
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-extrabold text-[#E8871E] font-display">
                  100%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B625A] mt-1">
                  RERA Compliance
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Company Values ─── */}
      <section className="py-20 bg-[#FFFBF5] border-y border-amber-150/40 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Principles We Standardize"
            subtitle="Core Values"
            align="center"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, index) => (
              <Card key={index} className="flex flex-col gap-4 text-left h-full">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
                  {v.icon}
                </div>
                <h4 className="font-bold text-[#2E2A26] font-display text-sm">{v.title}</h4>
                <p className="text-xs text-[#6B625A] leading-relaxed">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team Bios Directory ─── */}
      <section className="py-20 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Meet Our Board & Engineering Leads"
            subtitle="Management Team"
            align="center"
          />

          {loading ? (
            <Loader size="md" />
          ) : team.length === 0 ? (
            <p className="text-sm text-[#6B625A] text-center">Management directories are being updated.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:max-w-4xl md:mx-auto">
              {team.map((member) => (
                <motion.div
                  key={member._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-white border border-amber-100 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow duration-300"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-amber-50 mb-5 border-2 border-[#F5A623]/25 shadow-sm">
                    <img
                      src={member.photo?.url || "https://placehold.co/100/FAC354/FFFFFF?text=Staff"}
                      alt={member.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-bold text-sm text-[#2E2A26]">{member.name}</h3>
                  <span className="text-[10px] font-bold text-[#E8871E] uppercase mt-1 mb-3 block">
                    {member.designation}
                  </span>
                  <p className="text-xs text-[#6B625A] leading-relaxed">{member.bio}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
