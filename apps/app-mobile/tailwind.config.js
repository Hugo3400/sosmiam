// Tailwind pour l'app (NativeWind 4, Tailwind 3) : même thème que le site.
const couleurs = require("./src/theme/couleurs");
const variables = Object.fromEntries(Object.keys(couleurs).map((nom) => [nom, `rgb(var(--couleur-${nom}) / <alpha-value>)`]));

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: variables,
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
