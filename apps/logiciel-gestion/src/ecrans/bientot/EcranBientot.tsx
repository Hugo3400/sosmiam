import { Carte } from "~/composants/interface/Carte.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";

const ECRANS = {
  "big-sos": {
    titre: "BIG SOS",
    emoji: "🛟",
    texte: "Les lieux en vraie difficulté, à la une pendant 7 jours. Ici arriveront les demandes (espace pro ou ambassadeur), la vérification sur place, le vote de la communauté, ta validation, puis le suivi des 7 jours et le bilan. Gratuit mais limité : les limites restent à décider.",
  },
  notifications: {
    titre: "Notifications",
    emoji: "🔔",
    texte: "L'envoi et le suivi des notifications de l'app (un SOS près de chez toi, un BIG SOS qui démarre…), avec l'anti-spam. Elles arriveront avec l'app et les comptes.",
  },
  utilisateurs: {
    titre: "Comptes",
    emoji: "👥",
    texte: "Les comptes de l'app (à partir de 15 ans), des lieux et des ambassadeurs, avec leurs paliers. Les données sensibles resteront chiffrées et invisibles ici.",
  },
} as const;

/** Écran d'une partie pas encore construite : ce qu'elle fera, sans rien inventer. */
export function EcranBientot({ ecran }: { ecran: keyof typeof ECRANS }) {
  const { titre, emoji, texte } = ECRANS[ecran];
  return (
    <>
      <EnTeteEcran titre={titre} />
      <Carte><EtatVide emoji={emoji} titre="Ça arrive">{texte}</EtatVide></Carte>
    </>
  );
}
