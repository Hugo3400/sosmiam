import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_MIAM_SAFE_PRO_ANGLAIS } from "~/contenus/anglais/miam-safe-pro";

export const TEXTES_MIAM_SAFE_PRO = {
  meta: {
    titre: (nom: string) => `Miam Safe · ${nom}`,
    description: "La charte Miam Safe de ton lieu.",
  },
  chapo: "Quand un client ne se sent pas en sécurité, il sait qu'il peut compter sur ton équipe. Le badge Miam Safe le dit sur ta fiche, gratuitement.",
  traductionCourtoisie: "",
  illisible: "Oups, la charte ne s'est pas affichée. Recharge la page dans un instant.",
  signee: (le: string | null) => `Ton lieu a signé la charte Miam Safe${le === null ? "" : ` le ${le}`}.`,
  engagements: "Ce que ton équipe s'engage à faire",
  reserveAuGerant: "Seul le gérant signe ou quitte la charte.",
  signer: {
    bouton: "Signer la charte",
    engagement: "J'ai lu la charte, et mon équipe s'engage à la respecter.",
  },
  quitter: {
    bouton: "Quitter la charte",
    texte: "Le badge disparaîtra de ta fiche, et les alertes silencieuses ne pourront plus t'être envoyées.",
  },
  messages: {
    caseNonCochee: "Coche la case pour signer : c'est ton équipe qui s'engage.",
    signee: "C'est signé ! Le badge Miam Safe apparaît sur ta fiche. Merci à toute ton équipe.",
    quittee: "Tu as quitté la charte. Le badge disparaît de ta fiche.",
    erreurs: {
      "charte-retiree": "L'équipe SOS Miam a retiré la charte de ton lieu après un signalement. Écris-nous à bonjour@sosmiam.fr pour en parler.",
      "reserve-au-gerant": "Seul le gérant signe ou quitte la charte.",
    },
    panne: "Oups, ça n'a pas marché. Réessaie dans un instant.",
  },
};

export const TEXTES_MIAM_SAFE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_MIAM_SAFE_PRO>> = {
  fr: TEXTES_MIAM_SAFE_PRO,
  en: TEXTES_MIAM_SAFE_PRO_ANGLAIS,
};
