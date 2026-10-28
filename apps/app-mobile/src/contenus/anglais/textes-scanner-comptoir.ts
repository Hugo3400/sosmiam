import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_SCANNER_COMPTOIR } from "~/contenus/textes-scanner-comptoir";

export const TEXTES_SCANNER_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_SCANNER_COMPTOIR> = {
  soucis: {
    refuse: "No camera, no scan. No worries – you can also ask for the bill in the app.",
    bloque: "The camera is turned off for SOS Miam. You can allow it in your phone's Settings app, or ask for the bill in the app.",
    panne: "The camera wouldn't switch on. Try again in a moment, or ask for the bill in the app.",
  },
  etapes: {
    position: "Checking you're really there…",
    envoi: "Confirming your visit…",
    "nouvel-essai": "No signal – we'll keep trying on our own for a minute…",
  },
  cameraPrete: "Camera ready – aim at the counter QR code",
  voirFiche: "See the place's page",
  ouvrirReglages: "Open phone settings",
  reessayer: "Try again",
  titre: "Scan the counter QR code",
  consigne: "Turn on the camera and aim at the QR code the staff show you when you pay. We don't keep any images.",
  allumer: "Turn on the camera",
  fermer: "Close the scanner",
  viser: "Aim at the QR code the staff show you",
  pasDeQr: "No QR code? Ask for the bill",
  apercuWeb: "No camera in the web preview – scanning happens on your phone.",
  eteindreLampe: "Turn off the torch",
  allumerLampe: "Turn on the torch",
};
