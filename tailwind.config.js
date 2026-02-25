/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#E76F51", light: "#F09A83", dark: "#C95A3F" },
        secondary: { DEFAULT: "#2A9D8F", light: "#5BC0B5", dark: "#1E7A6F" },
        accent: { DEFAULT: "#F4A261", light: "#F7BE8F", dark: "#D98840" },
        mustard: { DEFAULT: "#E9C46A", light: "#F0D794", dark: "#D4AD4A" },
        terracotta: { DEFAULT: "#E76F51", light: "#F09A83", dark: "#C95A3F" },
        teal: { DEFAULT: "#2A9D8F", light: "#5BC0B5", dark: "#1E7A6F" },
        background: "#FFF8E7",
        surface: { DEFAULT: "#FFFFFF", warm: "#FFF5E6", variant: "#F5EFE0" },
        cream: { DEFAULT: "#FFF8E7", dark: "#FAF0D6", deeper: "#F5E8CA" },
        coral: { DEFAULT: "#E76F51", soft: "#FADAD2", muted: "#F7C4B8" },
        warm: {
          50: "#FFF8E7",
          100: "#FFF0CC",
          200: "#FFE4A3",
          300: "#FFD67A",
          400: "#F4A261",
          500: "#E76F51",
          600: "#C95A3F",
          700: "#9A4130",
          800: "#6B2C21",
          900: "#3D1A13",
        },
      },
      borderRadius: {
        "2.5xl": "20px",
        "3xl": "24px",
        "4xl": "32px",
        "5xl": "40px",
      },
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        hind: ["HindSiliguri_400Regular"],
        "hind-medium": ["HindSiliguri_500Medium"],
        "hind-semibold": ["HindSiliguri_600SemiBold"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        hero: ["32px", "40px"],
      },
      boxShadow: {
        warm: "0 4px 20px rgba(231, 111, 81, 0.12)",
        "warm-lg": "0 8px 32px rgba(231, 111, 81, 0.16)",
        soft: "0 2px 12px rgba(45, 27, 14, 0.06)",
        "soft-lg": "0 4px 24px rgba(45, 27, 14, 0.08)",
        float: "0 8px 40px rgba(45, 27, 14, 0.12)",
      },
    },
  },
  plugins: [],
};
