/** Maroon & cream institutional palette — same layout tokens as RLMSS structure (nav, header, slider, etc.). */
tailwind.config = {
  /** Injected in render.js — ensure Play CDN generates these utilities. */
  safelist: [
    "animate-marquee-y",
    "motion-reduce:animate-none",
    "motion-reduce:hidden",
    "h-[6rem]",
    "sm:h-[6.25rem]",
    "text-sky-900",
    "marker:text-sky-600",
    "leading-snug",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],
        display: ['"Source Sans 3"', "system-ui", "sans-serif"],
      },
      colors: {
        mes: {
          /** Maroon — headings, emphasis */
          primary: "#7f1d1d",
          primaryDark: "#5c1515",
          /** Deeper maroon — nav strip, gradients */
          navDeep: "#5c1515",
          /** Hover / open nav item text on white */
          active: "#7f1d1d",
          /** Gold — links, buttons, hairlines */
          accent: "#b8860b",
          accentLight: "#d4af37",
          /** Light cream page fill — keeps inner sections (often white) feeling bright */
          light: "#f5f2eb",
          /** Dark top strip behind contact */
          topbar: "#2c1810",
          /** Main nav background */
          nav: "#6b1e1e",
          goldLine: "#d4af37",
          /** Section underline accent (warm burgundy) */
          red: "#9b2335",
        },
        school: {
          navy: "#6b1e1e",
          slate: "#334155",
          gold: "#b8860b",
          cream: "#f5f2eb",
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        400: "400ms",
        600: "600ms",
        800: "800ms",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translate3d(0, 32px, 0)" },
          "100%": { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "marquee-y": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fade-in 0.8s ease-out forwards",
        "gradient-shift": "gradient-shift 12s ease-in-out infinite",
        "marquee-y": "marquee-y 28s linear infinite",
      },
    },
  },
};
