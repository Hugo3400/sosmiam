import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_ECRAN_COMPTOIR, TEXTES_ECRAN_QR_COMPTOIR, TEXTES_ONGLETS_PRO } from "~/contenus/textes-ecran-pro-comptoir";

export const TEXTES_ONGLETS_PRO_ANGLAIS: Traduction<typeof TEXTES_ONGLETS_PRO> = {
  comptoir: "Counter",
  comptoirLu: (total: number) => `Counter, tab 1 of ${total}`,
  reservations: "Bookings",
  reservationsLu: (aRepondre: number, total: number) =>
    `Bookings${aRepondre === 0 ? "" : `, ${aRepondre} request${aRepondre === 1 ? "" : "s"} to reply to`}, tab 2 of ${total}`,
  monLieu: "My venue",
  monLieuLu: (total: number) => `My venue, tab 3 of ${total}`,
};

export const TEXTES_ECRAN_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_ECRAN_COMPTOIR> = {
  titre: "Counter",
  sansLieu: "No venue to manage yet.",
  chargement: "Opening the counter…",
  qrEteint: "QR code off",
  enAttente: "Waiting",
  plusieursAdditions: "Several bills at once: you'll type in the code the customer shows you, so you don't mix up the tables.",
  recompenseOfferte: (nom: string) => `🎁 Reward handed to ${nom}`,
  codeFaux: "That's not the right code – check the one the customer's showing you.",
  visiteValidee: (nom: string, reglement: string) => `✓ ${nom}'s visit confirmed · ${reglement}`,
  refusTitre: (nom: string) => `Decline ${nom}'s bill?`,
  refusTitreSansNom: "Decline the bill?",
  refusDetail: "The customer will see a neutral reason, with no blame. Too many declines get reviewed by the SOS Miam team.",
  refusConfirmer: "Decline the bill",
  additionRefusee: (nom: string) => `${nom}'s bill declined`,
  annulationTitre: (nom: string) => `Undo ${nom}'s confirmation?`,
  annulationTitreSansNom: "Undo the confirmation?",
  annulationDetail: "Made a mistake? The points and the stamp are taken back. You can do this for up to 15 minutes after confirming.",
  annulationConfirmer: "Undo confirmation",
  validationAnnulee: (nom: string) => `${nom}'s confirmation undone`,
};

export const TEXTES_ECRAN_QR_COMPTOIR_ANGLAIS: Traduction<typeof TEXTES_ECRAN_QR_COMPTOIR> = {
  revenir: "Back to the counter",
  titre: "Scan me",
  consigne: "Once the bill's paid: Scan tab → “Scan the counter QR code”.",
  qrLu: (lieu: string) => `Counter QR code for ${lieu}. It changes every 30 seconds.`,
  tonLieu: "your venue",
  eteindre: "Turn off the QR code",
  eteintTitre: "QR code off",
  eteintTexte: "Everyone's scanned, or the 2 minutes are up. Another table? Show a new QR code.",
  chargement: "Switching on the counter…",
  nouveau: "Show a new QR code",
};
