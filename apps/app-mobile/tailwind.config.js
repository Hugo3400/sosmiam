// Tailwind pour l'app (NativeWind 4, Tailwind 3) : même thème que le site.
const couleurs = require("./src/theme/couleurs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: couleurs,
      borderRadius: { carte: "20px" },
    },
  },
  plugins: [],
};
