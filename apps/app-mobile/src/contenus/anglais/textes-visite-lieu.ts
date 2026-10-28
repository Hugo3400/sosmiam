import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_VISITE_LIEU } from "~/contenus/textes-visite-lieu";

export const TEXTES_VISITE_LIEU_ANGLAIS: Traduction<typeof TEXTES_VISITE_LIEU> = {
  titre: "Popping in?",
  recompensePrete: (libelle: string) => `${libelle} is waiting for you!`,
  autresDerriere: (n: number) => `And ${n} more after that. `,
  montrerCode: "Open your card and show the code to the staff.",
  recompensePreteLu: (libelle: string, texte: string) => `Loyalty card: ${libelle} is waiting for you! ${texte}`,
  progression: (tampons: number, sur: number, restantes: number, recompense: string) =>
    `${tampons}/${sur} · ${restantes} more visit${restantes === 1 ? "" : "s"} for ${recompense}`,
  progressionLu: (tampons: number, sur: number, restantes: number, recompense: string) =>
    `Loyalty card: ${tampons} stamp${tampons === 1 ? "" : "s"} out of ${sur}, ${restantes} more visit${restantes === 1 ? "" : "s"} for ${recompense}`,
  unTampon: ", a stamp",
  gainsSos: (pointsSos: number, points: number, tampon: string) =>
    `They've got an SOS on tonight: your visit's worth +${pointsSos} points instead of +${points}${tampon}, and you'll be able to leave a verified review. Ask for the bill when you pay.`,
  gains: (points: number, tampon: string) => `When it's time to pay, ask for the bill here: +${points} points${tampon}, and you'll be able to leave a verified review.`,
  bientot: "Coming soon: ask for the bill in the app so your visit counts.",
  reessayer: "Try again",
  reessayerIndice: "Reloads this place's visit info",
  demandeEnCoursLu: "Your bill request is in progress here. See the code",
  demandeEnCoursIndice: "Opens your request, with the code to show when you pay",
  demandeEnCours: "Your request is in progress",
  montrerTonCode: "Show your code when you pay. ",
  voirCode: "See the code",
  scannerIndice: "Opens the camera to scan the counter QR code",
  scanner: "Or scan the QR code the staff show you",
  fideliteIndice: "Opens your loyalty cards",
  reserverTexte: "Free, no card needed. The place replies in the app.",
  reserverLu: (titre: string) => `${titre}. Free, no card needed. The place replies in the app.`,
  reserverIndice: "Choose the day, the time and how many of you there are",
};
