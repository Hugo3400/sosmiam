import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_QR_COMPTOIR } from "~/contenus/textes-qr-comptoir";

export const TEXTES_QR_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_QR_COMPTOIR> = {
  montrerLu: "Show the counter QR code",
  montrerIndice: "After payment: the customer scans it and their visit counts. You choose how many people it's for.",
  montrer: "Show the QR code",
  montrerDetail: "Once they've paid, for 1 to 12 people. It changes every 30 seconds.",
  feuilleSousTitre: "It changes every 30 seconds and turns off after 2 minutes, or once everyone has scanned.",
  montrerPour: (personnes: number) => `Show QR code · ${personnes} ${personnes === 1 ? "person" : "people"}`,
  pourCombien: "How many people?",
  nombreLu: "Number of people",
  personnes: (n: number) => `${n} ${n === 1 ? "person" : "people"}`,
  allumeLu: (restantes: number, personnes: number, reste: string) =>
    `QR code on: ${restantes} of ${personnes} scan${restantes === 1 ? "" : "s"} left. It turns off in ${reste}`,
  allume: "QR code on",
  allumeDetail: (restantes: number, personnes: number, reste: string) => `${restantes} of ${personnes} scan${restantes === 1 ? "" : "s"} left · turns off in ${reste}`,
  voirLu: "Show the QR code full screen",
  voir: "Show QR code",
  eteindreLu: "Turn off the QR code",
  eteindre: "Turn off",
  resume: (restantes: number, personnes: number, reste: string) => `${restantes} of ${personnes} scan${restantes === 1 ? "" : "s"} left · turns off in ${reste}`,
  dejaScanne: (noms: string) => `Already scanned: ${noms}`,
  personne: "Nobody's scanned yet.",
};
