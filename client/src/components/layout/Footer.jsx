import { Link } from "react-router-dom";
import { FiInstagram, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { FaWhatsapp, FaFacebookF } from "react-icons/fa";
import { useSiteSettings } from "../../context/SiteSettingsContext.jsx";
import logoImg from "../../assets/logo.jpg";

export default function Footer() {
  const settings = useSiteSettings();

  const currentYear = new Date().getFullYear();

  const navLinks = [
    { name: "Home", path: "/#home" },
    { name: "About Us", path: "/#about" },
    { name: "Projects", path: "/#projects" },
    { name: "Gallery", path: "/#gallery" },
    { name: "Contact Us", path: "/#contact" },
  ];

  return (
    <footer className="bg-[#2E2A26] text-[#FFFBF5] border-t border-amber-900/10 pt-16 pb-8 text-left select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
        
        {/* Brand Column */}
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-800 shadow-sm bg-white">
              <img src={logoImg} alt="Aditya Builders Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight font-display text-white block leading-none">
                {settings.companyName}
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#F5A623] block mt-0.5">
                Quality | Trust
              </span>
            </div>
          </Link>
          <p className="text-[#A3988F] text-xs leading-relaxed max-w-sm">
            {settings.aboutUsShort ||
              "Quality + Time = Aditya. Shape premium spaces in Bhavnagar, Gujarat with commitment to customer dreams."}
          </p>
          <div className="flex gap-3">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-[#3D3732] flex items-center justify-center hover:bg-[#E1306C] text-white hover:text-white transition-colors"
              aria-label="Instagram"
            >
              <FiInstagram className="w-4.5 h-4.5" />
            </a>
            {settings.facebookUrl && (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#3D3732] flex items-center justify-center hover:bg-[#1877F2] text-white hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <FaFacebookF className="w-4 h-4" />
              </a>
            )}
            {settings.whatsappNumber && (
              <a
                href={`https://wa.me/${settings.whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-[#3D3732] flex items-center justify-center hover:bg-green-600 text-white hover:text-white transition-colors"
                aria-label="WhatsApp"
              >
                <FaWhatsapp className="w-4.5 h-4.5" />
              </a>
            )}
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="lg:pl-8">
          <h3 className="text-white font-bold font-display text-base mb-6 tracking-wide">Quick Links</h3>
          <ul className="flex flex-col gap-3.5 text-xs text-[#A3988F]">
            {navLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.path} className="hover:text-[#F5A623] transition-colors font-medium">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info Column */}
        <div>
          <h3 className="text-white font-bold font-display text-base mb-6 tracking-wide">Contact Info</h3>
          <ul className="flex flex-col gap-4 text-xs text-[#A3988F]">
            <li className="flex items-start gap-3">
              <FiMapPin className="text-[#F5A623] w-4.5 h-4.5 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{settings.address}</span>
            </li>
            <li className="flex items-start gap-3">
              <FiPhone className="text-[#F5A623] w-4.5 h-4.5 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1.5">
                {settings.phoneNumbers &&
                  settings.phoneNumbers.map((num) => (
                    <a
                      key={num}
                      href={`tel:${num.replace(/\s+/g, "")}`}
                      className="hover:text-white transition-colors font-medium"
                    >
                      {num}
                    </a>
                  ))}
              </div>
            </li>
            <li className="flex items-center gap-3">
              <FiMail className="text-[#F5A623] w-4.5 h-4.5 shrink-0" />
              <a
                href={`mailto:${settings.email}`}
                className="hover:text-white transition-colors font-medium break-all"
              >
                {settings.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Embedded Map Column */}
        <div className="flex flex-col gap-3">
          <h3 className="text-white font-bold font-display text-base mb-4 tracking-wide">Our Location</h3>
          {settings.mapEmbedUrl ? (
            <div className="w-full h-32 rounded-xl overflow-hidden border border-amber-900/40">
              <iframe
                title="Aditya Builders Office Location Map"
                src={settings.mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="w-full h-32 rounded-xl bg-[#3D3732] flex items-center justify-center text-xs text-[#A3988F] font-bold">
              Map Unavailable
            </div>
          )}
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#3D3732] pt-8 text-center text-xs text-[#A3988F] flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© {currentYear} {settings.companyName}. All rights reserved.</p>
        <p className="flex items-center gap-1 font-semibold text-[#A3988F]/75">
          Quality + Time = Aditya
        </p>
      </div>
    </footer>
  );
}
