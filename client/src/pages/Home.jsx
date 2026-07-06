import { motion } from "framer-motion";

// ─── Framer Motion Variants ──────────────────────────────────────────────────
// These are used to prove framer-motion is wired up correctly.
// A staggered fade-in animates the hero content on mount.
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

// ─── Stat Block ──────────────────────────────────────────────────────────────
function StatCard({ value, label }) {
  return (
    <motion.div
      variants={fadeInUp}
      className="flex flex-col items-center p-6 rounded-xl bg-white shadow-card border border-amber-100"
    >
      <span
        className="text-4xl font-bold font-display"
        style={{ color: "var(--color-primary)" }}
      >
        {value}
      </span>
      <span className="mt-1 text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 py-20"
      style={{ background: "linear-gradient(160deg, #FFFBF5 0%, #FFF6E8 100%)" }}
    >
      {/* Hero Section — fade-in animation proves framer-motion works */}
      <motion.section
        className="section-container text-center max-w-3xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Tagline badge */}
        <motion.div variants={fadeInUp}>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{
              background: "rgba(245, 166, 35, 0.12)",
              color: "var(--color-secondary)",
              border: "1px solid rgba(245, 166, 35, 0.3)",
            }}
          >
            ✦ Bhavnagar, Gujarat • Est. 2009
          </span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          variants={fadeInUp}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 font-display"
          style={{ color: "var(--color-text)" }}
        >
          Aditya{" "}
          <span style={{ color: "var(--color-primary)" }}>Builders</span>
        </motion.h1>

        {/* Gold underline */}
        <motion.span
          variants={fadeInUp}
          className="block mx-auto w-20 h-1.5 rounded-full mb-6"
          style={{
            background: "linear-gradient(90deg, #F5A623, #E8871E)",
          }}
        />

        {/* Tagline */}
        <motion.p
          variants={fadeInUp}
          className="text-xl sm:text-2xl font-medium mb-3 font-display"
          style={{ color: "var(--color-secondary)" }}
        >
          You Dream it, We Build it.
        </motion.p>
        <motion.p
          variants={fadeInUp}
          className="text-base sm:text-lg mb-10"
          style={{ color: "var(--color-text-muted)" }}
        >
          Quality + Time = Aditya
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <a href="/projects" className="btn-primary text-base">
            View Our Projects
          </a>
          <a href="/contact" className="btn-outline text-base">
            Get In Touch
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full"
        >
          <StatCard value="15+" label="Years of Experience" />
          <StatCard value="1000+" label="Happy Customers" />
          <StatCard value="3" label="Signature Projects" />
        </motion.div>

        {/* Setup confirmation note */}
        <motion.p
          variants={fadeInUp}
          className="mt-12 text-xs px-4 py-2 rounded-lg inline-block"
          style={{
            background: "rgba(59, 130, 196, 0.08)",
            color: "var(--color-accent-blue)",
            border: "1px solid rgba(59, 130, 196, 0.2)",
          }}
        >
          🚀 Phase 1 Complete — Foundation setup verified. Framer Motion ✓ · Tailwind ✓ · React Router ✓
        </motion.p>
      </motion.section>
    </main>
  );
}
