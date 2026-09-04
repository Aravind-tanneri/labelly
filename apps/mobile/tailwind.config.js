/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#020203",
        surface: "#0d1117",
        elevatedSurface: "#161b22",
        primary: "#25D366",
        text: "#ECECEC",
        secondaryText: "#8A8A8A",
        border: "#3A4A54",
        success: "#25D366",
        warning: "#FFA500",
        error: "#E53935",
      },
    },
  },
  plugins: [],
};
