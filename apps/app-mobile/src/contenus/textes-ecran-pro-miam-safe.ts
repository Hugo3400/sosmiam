import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_MIAM_SAFE_PRO_ANGLAIS } from "~/contenus/anglais/textes-ecran-pro-miam-safe";

export const TEXTES_ECRAN_MIAM_SAFE_PRO = {
  retour: "Retour",
  titre: "Miam Safe",
  intro: "Quand un client ne se sent pas en sécurité, il sait qu'il peut compter sur ton équipe. Le badge Miam Safe le dit sur ta fiche, gratuitement.",
  sansLieu: "Ouvre le mode pro de ton lieu pour voir sa charte.",
  reserveGerant: "Seul le gérant signe ou quitte la charte.",
  engagement: "J'ai lu la charte, et mon équipe s'engage à la respecter",
  signature: "Signature…",
  signer: "Signer la charte",
  signerIndice: "Le badge Miam Safe apparaît sur ta fiche",
  signerIndiceSansEngagement: "Allume d'abord l'engagement de ton équipe",
  avertissementQuitter: "Le badge disparaîtra de ta fiche, et les alertes silencieuses ne pourront plus t'être envoyées.",
  enCours: "Un instant…",
  quitter: "Quitter la charte",
  quitterTitre: "Quitter la charte Miam Safe ?",
  rester: "Je reste",
  resterIndice: "Ton lieu garde la charte et son badge",
  reussites: {
    signer: "C'est signé ! Le badge Miam Safe apparaît sur ta fiche. Merci à toute ton équipe.",
    quitter: "Tu as quitté la charte. Le badge disparaît de ta fiche.",
  },
} as const;

export const TEXTES_ECRAN_MIAM_SAFE_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_MIAM_SAFE_PRO>> = {
  fr: TEXTES_ECRAN_MIAM_SAFE_PRO,
  en: TEXTES_ECRAN_MIAM_SAFE_PRO_ANGLAIS,
};
