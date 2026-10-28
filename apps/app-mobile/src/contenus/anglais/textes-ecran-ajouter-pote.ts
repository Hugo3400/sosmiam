import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_AJOUTER_POTE } from "~/contenus/textes-ecran-ajouter-pote";

export const TEXTES_ECRAN_AJOUTER_POTE_ANGLAIS: Traduction<typeof TEXTES_ECRAN_AJOUTER_POTE> = {
  titre: "Add a friend",
  sousTitre: "The more the merrier – and the more places we rescue.",
  tonQr: "Your QR code",
  tonQrTexte: "Your friend scans it in the app (Community, “Add a friend”) and hey presto – you're in the same crew.",
  scanner: "Scan a QR code",
  scannerTexte: "Your friend shows you theirs (in Community, “Add a friend”). Point your camera and you're done.",
  lienLibelle: "Or paste your friend's link",
  unInstant: "Just a sec…",
  ajouterLien: "Add with this link",
  ajouterLienIndice: "Finds your friend from their link and adds them to your crew",
  chercher: "Search for a username",
  chercherTexte: "Know their @? Type it in and we'll tell you if we find them.",
  rejoindreTitre: (pseudo: string) => `Join @${pseudo}'s crew?`,
  demanderTitre: (pseudo: string) => `Send @${pseudo} a friend request?`,
  rejoindreDetail:
    "This link comes from outside the app. In a crew, you can each see the other's city, points and saved places, so only join someone you know.",
  demanderDetail: "This link comes from outside the app. A request will go out, and this person can accept it or not.",
  rejoindre: "Join their crew",
  envoyerDemande: "Send the request",
  nonMerci: "No thanks",
  nonMerciIndice: "Nothing gets sent – you stay on this screen",
};
