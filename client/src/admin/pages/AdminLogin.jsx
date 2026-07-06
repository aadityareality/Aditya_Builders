import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiLock, FiMail, FiEye, FiEyeOff,
  FiCheckCircle, FiAward, FiUsers, FiShield,
} from "react-icons/fi";

const ADMIN_SLUG = import.meta.env.VITE_ADMIN_SLUG || "/secure-panel-x9k2";

const features = [
  { icon: FiAward,  label: "Quality Construction",  desc: "ISI-grade materials & precision craftsmanship" },
  { icon: FiUsers,  label: "Expert Team",            desc: "Seasoned engineers & design architects" },
  { icon: FiShield, label: "Trusted Service",        desc: "Transparent pricing & on-time delivery" },
];

export default function AdminLogin() {
  const { login, isAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loggingIn, setLoggingIn]   = useState(false);
  const [errorMsg, setErrorMsg]     = useState("");
  const [mounted, setMounted]       = useState(false);

  useEffect(() => {
    setMounted(true);
    // Pre-fill email if remembered
    const saved = localStorage.getItem("ab_admin_email");
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="w-10 h-10 rounded-full border-2 border-[#E8871E] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to={`${ADMIN_SLUG}/leads`} replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setErrorMsg("");

    if (rememberMe) localStorage.setItem("ab_admin_email", email);
    else            localStorage.removeItem("ab_admin_email");

    const res = await login(email, password);
    setLoggingIn(false);

    if (res?.success) {
      navigate(`${ADMIN_SLUG}/leads`, { replace: true });
    } else {
      setErrorMsg("Invalid credentials. Please try again.");
    }
  };

  return (
    <main
      className="min-h-screen w-full relative overflow-hidden flex"
      style={{ fontFamily: "'Inter', 'Outfit', sans-serif" }}
    >
      {/* ─── FULL-BLEED HERO BACKGROUND ─────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <img
          src="/admin-hero.png"
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Warm golden overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a120a]/80 via-[#2e1d0e]/60 to-[#1a120a]/30" />
        {/* Subtle geometric line pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F5A623" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* ─── LEFT SECTION — BRANDING (55%) ──────────────────────── */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-[55%] p-12 xl:p-16 2xl:p-20">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex items-center gap-3"
        >
          <img src="/logo.jpg" alt="Aaditya Builders" className="h-10 w-auto rounded-lg shadow-lg" />
          <div>
            <p className="text-white font-extrabold text-base tracking-tight leading-none">Aaditya Builders</p>
            <p className="text-[#F5A623] text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Quality · Trust</p>
          </div>
        </motion.div>

        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div>
            <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold leading-[1.1] text-white tracking-tight">
              Building Dreams,
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #F5A623 0%, #FFD166 50%, #E8871E 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Creating Realities.
              </span>
            </h1>

            {/* Gold divider */}
            <div className="mt-5 w-14 h-1 rounded-full" style={{ background: "linear-gradient(90deg, #F5A623, #FFD166)" }} />
          </div>

          <p className="text-white/70 text-sm xl:text-base font-medium leading-relaxed max-w-sm">
            Premium Construction&nbsp;·&nbsp;Trusted Quality&nbsp;·&nbsp;Timely Delivery
          </p>

          {/* Feature Pills */}
          <div className="flex flex-col gap-4 mt-2">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -20 }}
                animate={mounted ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)" }}>
                  <Icon className="w-4.5 h-4.5 text-[#F5A623]" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{label}</p>
                  <p className="text-white/50 text-[11px] mt-0.5">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.8 }}
          className="text-white/35 text-xs"
        >
          © 2026 Aaditya Builders. All Rights Reserved.
        </motion.p>
      </div>

      {/* ─── RIGHT SECTION — LOGIN CARD (45%) ───────────────────── */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 40, scale: 0.97 }}
          animate={mounted ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Glassmorphism Card */}
          <div
            className="relative rounded-3xl overflow-hidden p-8 sm:p-10"
            style={{
              background: "rgba(255, 251, 245, 0.92)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
              border: "1px solid rgba(245, 166, 35, 0.18)",
              boxShadow: "0 32px 80px rgba(30, 18, 4, 0.35), 0 0 0 1px rgba(255,255,255,0.25) inset",
            }}
          >
            {/* Subtle inner glow top */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.5), transparent)" }} />

            {/* Mobile logo (shown only on mobile) */}
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <img src="/logo.jpg" alt="Aaditya Builders" className="h-8 w-auto rounded-md" />
              <div>
                <p className="font-extrabold text-[#2E2A26] text-sm leading-none">Aaditya Builders</p>
                <p className="text-[#F5A623] text-[9px] font-bold uppercase tracking-widest mt-0.5">Admin Portal</p>
              </div>
            </div>

            {/* Card Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #F5A623 0%, #E8871E 100%)" }}>
                <FiLock className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1a120a] tracking-tight leading-none">
                  Admin Access
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A8878] mt-1">
                  Control Panel Sign In
                </p>
              </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 px-4 py-3 rounded-xl text-xs font-semibold text-red-700 text-center"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  {errorMsg}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#7A6E65] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A97D]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-[#1a120a] placeholder-[#C4A97D]/60 transition-all duration-200 outline-none"
                    style={{
                      background: "rgba(250,246,239,0.8)",
                      border: "1.5px solid rgba(196,169,125,0.35)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#F5A623"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(196,169,125,0.35)"}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#7A6E65] mb-2">
                  Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4A97D]" />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl text-sm text-[#1a120a] placeholder-[#C4A97D]/60 transition-all duration-200 outline-none"
                    style={{
                      background: "rgba(250,246,239,0.8)",
                      border: "1.5px solid rgba(196,169,125,0.35)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#F5A623"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(196,169,125,0.35)"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#C4A97D] hover:text-[#E8871E] transition-colors"
                    tabIndex={-1}
                  >
                    {showPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <div
                    onClick={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-200 cursor-pointer"
                    style={{
                      borderColor: rememberMe ? "#F5A623" : "rgba(196,169,125,0.5)",
                      background: rememberMe ? "linear-gradient(135deg,#F5A623,#E8871E)" : "transparent",
                    }}
                  >
                    {rememberMe && <FiCheckCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-[#7A6E65] font-medium group-hover:text-[#2E2A26] transition-colors">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#E8871E] hover:text-[#C4781A] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Sign In Button */}
              <motion.button
                type="submit"
                disabled={loggingIn}
                whileHover={{ scale: loggingIn ? 1 : 1.015 }}
                whileTap={{ scale: loggingIn ? 1 : 0.985 }}
                className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide mt-1 relative overflow-hidden transition-all duration-300 select-none"
                style={{
                  background: loggingIn
                    ? "rgba(196,169,125,0.5)"
                    : "linear-gradient(135deg, #F5A623 0%, #E8871E 50%, #C4781A 100%)",
                  boxShadow: loggingIn ? "none" : "0 8px 24px rgba(232,135,30,0.35), 0 2px 8px rgba(232,135,30,0.2)",
                }}
              >
                {/* Shine sweep on hover */}
                {!loggingIn && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </span>
              </motion.button>
            </form>

            {/* Card Footer */}
            <p className="text-center text-[10px] text-[#B0A090] mt-6 font-medium">
              Restricted access — authorised personnel only
            </p>
          </div>

          {/* Below card copyright (mobile) */}
          <p className="lg:hidden text-center text-white/40 text-[10px] mt-6">
            © 2026 Aaditya Builders. All Rights Reserved.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
