/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // ─── Aditya Builders Brand Palette ───────────────────────────────────
      // Inspired by the sun logo: warm gold/amber primary with a subtle
      // blue-red wave accent. The entire site is light-themed (no dark mode).
      colors: {
        primary: {
          DEFAULT: "#F5A623",  // warm gold — main brand colour
          light:   "#FAC354",  // lighter gold for hover states
          dark:    "#D4861A",  // deeper amber for active/pressed
        },
        secondary: {
          DEFAULT: "#E8871E",  // sun orange — secondary actions, badges
          light:   "#F0A44A",
          dark:    "#C26A0E",
        },
        accent: {
          blue: {
            DEFAULT: "#3B82C4",  // soft blue from the wave in the logo
            light:   "#6DA5D8",
            dark:    "#2563A0",
          },
          red: {
            DEFAULT: "#D64545",  // soft coral/red from the wave
            light:   "#E27070",
            dark:    "#B02E2E",
          },
        },
        background: {
          DEFAULT: "#FFFBF5",  // off-white cream — page background
          subtle:  "#FFF6E8",  // slightly warmer cream for card/section backgrounds
        },
        "text-dark": {
          DEFAULT: "#2E2A26",  // warm dark gray — primary text (not pure black)
          muted:   "#6B625A",  // muted text for captions, placeholders
        },
      },

      // ─── Typography ───────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],  // headings & hero text
      },

      // ─── Custom Shadows ───────────────────────────────────────────────────
      boxShadow: {
        warm:   "0 4px 24px 0 rgba(245, 166, 35, 0.15)",
        card:   "0 2px 16px 0 rgba(46, 42, 38, 0.08)",
        "card-hover": "0 8px 32px 0 rgba(46, 42, 38, 0.14)",
      },

      // ─── Border Radius ────────────────────────────────────────────────────
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
    },
  },
  plugins: [],
};
