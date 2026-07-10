/** Aqua blue institutional palette — calm, eye-friendly tones across nav, header, and sections. */

tailwind.config = {

  /** Injected in render.js — ensure Play CDN generates these utilities. */

  safelist: [

    "animate-marquee-y",

    "animate-marquee-x",

    "motion-reduce:animate-none",

    "motion-reduce:hidden",

    "h-[6rem]",

    "sm:h-[6.25rem]",

    "text-sky-900",

    "marker:text-sky-600",

    "leading-snug",

    "z-[65]",

    "backdrop-blur-[2px]",

    "max-w-[min(100vw,20rem)]",

    "overscroll-y-contain",

    "[&::-webkit-details-marker]:hidden",

    "hover:shadow-mes-primary/10",

    "hover:shadow-mes-primary/15",

    "hover:shadow-mes-primary/20",

    "group-hover:shadow-mes-primary/20",

  ],

  theme: {

    extend: {

      fontFamily: {

        sans: ['"Source Sans 3"', "system-ui", "sans-serif"],

        display: ['"Source Sans 3"', "system-ui", "sans-serif"],

      },

      colors: {

        mes: {

          /** Deep aqua — headings, emphasis */

          primary: "#0e7490",

          primaryDark: "#155e75",

          /** Deeper teal — nav gradients, dark panels */

          navDeep: "#134e4a",

          /** Active / hover text on light surfaces */

          active: "#0e7490",

          /** Bright aqua — links, buttons, highlights */

          accent: "#06b6d4",

          accentLight: "#22d3ee",

          /** Soft ice-blue page fill */

          light: "#dbeafe",

          /** Dark top strip behind contact */

          topbar: "#0c4a6e",

          /** Main nav background — darker aqua bar */

          nav: "#0c6e87",

          /** Nav underline & hairlines (kept as goldLine token) */

          goldLine: "#5eead4",

          /** Section underline accent */

          red: "#22d3ee",

        },

        school: {

          navy: "#0c6e87",

          slate: "#334155",

          gold: "#06b6d4",

          cream: "#dbeafe",

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

        "marquee-x": {

          "0%": { transform: "translateX(0)" },

          "100%": { transform: "translateX(-50%)" },

        },

      },

      animation: {

        "fade-in-up": "fade-in-up 1s cubic-bezier(0.16, 1, 0.3, 1) forwards",

        "fade-in": "fade-in 0.8s ease-out forwards",

        "gradient-shift": "gradient-shift 12s ease-in-out infinite",

        "marquee-y": "marquee-y 28s linear infinite",

        "marquee-x": "marquee-x 48s linear infinite",

      },

    },

  },

};


