import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_CONNECTER_APPAREIL_ANGLAIS } from "~/contenus/anglais/textes-connecter-appareil";

export const TEXTES_CONNECTER_APPAREIL = {
  faitTitre: "C'est connecté !",
  refuseTitre: "Refusé",
  lienRefuseTitre: "Personne n'entre",
  expireTitre: "Trop tard",
  erreurTitre: "Oups",
  erreurTexte: "Ça n'a pas marché cette fois. Réessaie dans un instant.",
  verifierLu: (appareil: string) => `Vérifie bien avant de dire oui : quelqu'un veut se connecter à ton compte sur ${appareil}.`,
  confirmerTitre: "Vérifie bien avant de dire oui",
  confirmerSousTitre: "Une connexion, c'est l'accès à tout ton compte.",
  scannerAutre: "Scanner un autre QR",
  revenirAuCompte: "Revenir à Mon compte",
  lectureLue: "On lit le QR code",
  lienDuQr: "Le lien du QR",
  lireLien: "Lire ce lien",
  annulerBiometrie: "Annuler",
  carte: {
    reponsePart: "Ta réponse part…",
    unInstant: "Un instant…",
    demandeLue: (appareil: string, origine: string | null, heure: string) =>
      `Quelqu'un veut se connecter à ton compte sur ${appareil}${origine ? `, ${origine}` : ""}, demandé à ${heure}`,
    quelquUn: "Quelqu'un veut se connecter à TON compte sur :",
    demandeA: (heure: string) => `Demandé à ${heure}`,
  },
} as const;

export const TEXTES_CONNECTER_APPAREIL_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_CONNECTER_APPAREIL>> = {
  fr: TEXTES_CONNECTER_APPAREIL,
  en: TEXTES_CONNECTER_APPAREIL_ANGLAIS,
};
