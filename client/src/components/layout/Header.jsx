import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMenu, FiX, FiPhone, FiInstagram } from "react-icons/fi";
import { useSiteSettings } from "../../context/SiteSettingsContext.jsx";
import logoImg from "../../assets/logo.jpg";

export default function Header() {
  const settings = useSiteSettings();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "Home", path: "/#home" },
    { name: "About Us", path: "/#about" },
    { name: "Projects", path: "/#projects" },
    { name: "Gallery", path: "/#gallery" },
    { name: "Contact Us", path: "/#contact" },
  ];

  return (
    <>

      {/* Header element */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          {/* Logo / Brand Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-100 group-hover:scale-105 transition-transform duration-200 shadow-sm bg-white">
              <img src={logoImg} alt="Aditya Builders Logo" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight font-display text-[#2E2A26] block leading-none">
                {settings.companyName}
              </span>
              <span className="text-xs font-semibold tracking-wider uppercase text-[#F5A623] block mt-0.5">
                Quality | Trust
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Link items */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/#home"
                  ? location.hash === "#home" || (location.hash === "" && location.pathname === "/")
                  : location.hash === link.path.substring(1);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-xs font-bold tracking-wider uppercase transition-colors py-2 relative hover:text-[#F5A623] ${
                    isActive ? "text-[#F5A623]" : "text-[#6B625A]"
                  }`}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F5A623] rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Hamburger Icon trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#2E2A26] hover:bg-amber-50 focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Slide-in menu using AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />
            {/* Menu container drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
              className="absolute top-20 right-0 w-64 bg-[#FFFBF5] h-[calc(100vh-5rem)] shadow-2xl border-l border-amber-100 flex flex-col p-6 text-left"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive =
                    link.path === "/#home"
                      ? location.hash === "#home" || (location.hash === "" && location.pathname === "/")
                      : location.hash === link.path.substring(1);
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={`text-sm font-bold py-2.5 px-4 rounded-xl transition-colors ${
                        isActive
                          ? "bg-amber-100 text-[#E8871E] font-extrabold"
                          : "text-[#2E2A26] hover:bg-amber-50"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-auto border-t border-amber-100 pt-6 flex flex-col gap-4 text-xs text-[#6B625A]">
                {settings.phoneNumbers && settings.phoneNumbers.length > 0 && (
                  <span className="flex items-center gap-2">
                    📞 {settings.phoneNumbers[0]}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  📧 {settings.email}
                </span>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#E8871E] font-bold"
                >
                  <FiInstagram /> Instagram
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
