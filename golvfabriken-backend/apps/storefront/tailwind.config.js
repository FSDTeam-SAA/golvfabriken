import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  plugins: [
    tailwindcssAnimate,
    function ({ addUtilities, theme }) {
      const opacityUtilities = {};
      const opacityValues = theme("opacity");

      Object.keys(opacityValues).forEach((opacity) => {
        opacityUtilities[`.bg-opacity-${opacity}`] = {
          "--tw-bg-opacity": opacityValues[opacity],
        };
        opacityUtilities[`.text-opacity-${opacity}`] = {
          "--tw-text-opacity": opacityValues[opacity],
        };
        opacityUtilities[`.border-opacity-${opacity}`] = {
          "--tw-border-opacity": opacityValues[opacity],
        };
      });

      addUtilities(opacityUtilities);
    },
  ],
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      colors: {
        // Golvfabriken brand colors
        golvfabriken: {
          // Base colors - warm neutrals
          beige: {
            50: "#FAFAF8",
            100: "#F5F5F2",
            200: "#ECECE6",
            300: "#E0E0D8",
          },
          sand: {
            100: "#F7F4EF",
            200: "#EDE8E0",
            300: "#E3DDD2",
          },
          // Wood tones - secondary accents
          wood: {
            light: "#D4B896",
            DEFAULT: "#B89968",
            dark: "#9D7F4F",
          },
          // Primary accents - CTAs and headings
          green: {
            DEFAULT: "#2C4A3B",
            dark: "#1F3329",
            light: "#3D5F4C",
          },
          graphite: {
            DEFAULT: "#2B2D2E",
            light: "#404244",
          },
          // Campaign accent (use sparingly)
          terracotta: {
            DEFAULT: "#C85A3F",
            light: "#D47159",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["Roboto Mono", "monospace"],
      },
      fontSize: {
        // Hierarchy
        "display": ["3.5rem", { lineHeight: "1.1", fontWeight: "700" }], // 56px
        "h1": ["2.5rem", { lineHeight: "1.2", fontWeight: "700" }], // 40px
        "h2": ["2rem", { lineHeight: "1.25", fontWeight: "600" }], // 32px
        "h3": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }], // 24px
        "h4": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }], // 20px
        "body-lg": ["1.125rem", { lineHeight: "1.6", fontWeight: "400" }], // 18px
        "body": ["1rem", { lineHeight: "1.6", fontWeight: "400" }], // 16px
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }], // 14px
        "caption": ["0.75rem", { lineHeight: "1.4", fontWeight: "500" }], // 12px
        "price": ["1.5rem", { lineHeight: "1", fontWeight: "700" }], // 24px
        "price-sm": ["1.125rem", { lineHeight: "1", fontWeight: "600" }], // 18px
      },
      borderRadius: {
        "gf": "0.5rem", // 8px - standard Golvfabriken radius
      },
      boxShadow: {
        "gf-sm": "0 1px 3px 0 rgba(0, 0, 0, 0.08)",
        "gf": "0 4px 12px 0 rgba(0, 0, 0, 0.08)",
        "gf-lg": "0 8px 24px 0 rgba(0, 0, 0, 0.12)",
      },
    },
  },
};
