import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_CONNECTER_APPAREIL } from "~/contenus/textes-connecter-appareil";

export const TEXTES_CONNECTER_APPAREIL_ANGLAIS: Traduction<typeof TEXTES_CONNECTER_APPAREIL> = {
  faitTitre: "Connected!",
  refuseTitre: "Declined",
  lienRefuseTitre: "No one gets in",
  expireTitre: "Too late",
  erreurTitre: "Oops",
  erreurTexte: "That didn't work this time. Try again in a moment.",
  verifierLu: (appareil: string) => `Check carefully before you say yes: someone wants to log in to your account on ${appareil}.`,
  confirmerTitre: "Check carefully before you say yes",
  confirmerSousTitre: "Logging in means access to your whole account.",
  scannerAutre: "Scan another QR code",
  revenirAuCompte: "Back to My account",
  lectureLue: "Reading the QR code",
  lienDuQr: "The QR code link",
  lireLien: "Read this link",
  annulerBiometrie: "Cancel",
  carte: {
    reponsePart: "Sending your answer…",
    unInstant: "Just a sec…",
    demandeLue: (appareil: string, origine: string | null, heure: string) =>
      `Someone wants to log in to your account on ${appareil}${origine ? `, ${origine}` : ""}, requested at ${heure}`,
    quelquUn: "Someone wants to log in to YOUR account on:",
    demandeA: (heure: string) => `Requested at ${heure}`,
  },
};
