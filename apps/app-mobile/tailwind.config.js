// Tailwind pour l'app (NativeWind 4, Tailwind 3) : même thème que le site.
const couleurs = require("./src/theme/couleurs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Pas de mode sombre automatique pour l'instant (app.json : userInterfaceStyle « light »)
  darkMode: "class",
  theme: {
    extend: {
      colors: couleurs,
      borderRadius: { carte: "20px" },
      // Polices embarquées dans l'app (chargées dans src/app/_layout.tsx). En React Native, chaque graisse est une police :
      // utiliser ces classes plutôt que font-bold / font-extrabold.
      fontFamily: {
        titre: ["BricolageGrotesque_800ExtraBold"],
        "titre-gras": ["BricolageGrotesque_700Bold"],
        texte: ["Inter_400Regular"],
        "texte-moyen": ["Inter_500Medium"],
        "texte-semi": ["Inter_600SemiBold"],
        "texte-gras": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};
