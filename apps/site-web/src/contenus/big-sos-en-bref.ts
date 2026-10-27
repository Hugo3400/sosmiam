import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_BIG_SOS_EN_BREF_ANGLAIS } from "~/contenus/anglais/big-sos-en-bref";

export const TEXTES_BIG_SOS_EN_BREF = {
  titre: "Un coup dur ? Tout le quartier à la rescousse.",
  chapo:
    "Travaux devant la porte, grosse baisse de clients, coup dur : quand un lieu indépendant traverse une vraie galère, il passe à la une de l'app pendant 7 jours. Le but : remplir la salle, ensemble.",
  etapes: [
    { titre: "La demande", texte: "Le lieu la fait depuis son espace pro, ou un ambassadeur le propose." },
    { titre: "La vérification", texte: "Un ambassadeur du quartier passe sur place." },
    { titre: "Le vote", texte: "La communauté soutient les demandes qui la touchent." },
    { titre: "La une", texte: "L'équipe valide, et le lieu passe à la une pendant 7 jours." },
  ],
  apres: {
    question: "Et après ?",
    texte: "On fait le bilan ensemble, et le lieu garde sa page, ses vidéos et ses nouveaux habitués.",
  },
  surSaPage: "Sur sa page, pendant 7 jours",
  page: [
    "L'histoire du lieu, racontée par son équipe",
    "Les vidéos des créateurs venus le filmer",
    "Un objectif de mobilisation avec une jauge en direct",
    "Des bons solidaires : tu paies maintenant, tu profites plus tard",
  ],
  note: "💬 Le lieu raconte son histoire lui-même et valide tout ce qui est dit : pour donner envie de venir, jamais pour faire pitié.",
};

export const TEXTES_BIG_SOS_EN_BREF_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_BIG_SOS_EN_BREF>> = {
  fr: TEXTES_BIG_SOS_EN_BREF,
  en: TEXTES_BIG_SOS_EN_BREF_ANGLAIS,
};
