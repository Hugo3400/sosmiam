import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_ECRAN_COMPTOIR_ANGLAIS, TEXTES_ECRAN_QR_COMPTOIR_ANGLAIS, TEXTES_ONGLETS_PRO_ANGLAIS } from "~/contenus/anglais/textes-ecran-pro-comptoir";

export const TEXTES_ONGLETS_PRO = {
  comptoir: "Comptoir",
  comptoirLu: (total: number) => `Comptoir, onglet 1 sur ${total}`,
  reservations: "Réservations",
  reservationsLu: (aRepondre: number, total: number) =>
    `Réservations${aRepondre === 0 ? "" : `, ${aRepondre} demande${aRepondre > 1 ? "s" : ""} à répondre`}, onglet 2 sur ${total}`,
  monLieu: "Mon lieu",
  monLieuLu: (total: number) => `Mon lieu, onglet 3 sur ${total}`,
} as const;

export const TEXTES_ONGLETS_PRO_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ONGLETS_PRO>> = { fr: TEXTES_ONGLETS_PRO, en: TEXTES_ONGLETS_PRO_ANGLAIS };

export const TEXTES_ECRAN_COMPTOIR = {
  titre: "Comptoir",
  sansLieu: "Aucun lieu à gérer pour l'instant.",
  chargement: "On ouvre le comptoir…",
  qrEteint: "QR éteint",
  enAttente: "En attente",
  plusieursAdditions: "Plusieurs additions en même temps : tu taperas le code que te montre le client, pour ne pas te tromper de table.",
  recompenseOfferte: (nom: string) => `🎁 Récompense offerte à ${nom}`,
  codeFaux: "Ce n'est pas le bon code : vérifie celui que te montre le client.",
  visiteValidee: (nom: string, reglement: string) => `✓ Visite de ${nom} validée · ${reglement}`,
  refusTitre: (nom: string) => `Refuser l'addition de ${nom} ?`,
  refusTitreSansNom: "Refuser l'addition ?",
  refusDetail: "Le client lira un motif neutre, sans reproche. Trop de refus sont relus par l'équipe SOS Miam.",
  refusConfirmer: "Refuser l'addition",
  additionRefusee: (nom: string) => `Addition de ${nom} refusée`,
  annulationTitre: (nom: string) => `Annuler la validation de ${nom} ?`,
  annulationTitreSansNom: "Annuler la validation ?",
  annulationDetail: "Une erreur ? Les points et le tampon repartent. Possible pendant 15 minutes après la validation.",
  annulationConfirmer: "Annuler la validation",
  validationAnnulee: (nom: string) => `Validation de ${nom} annulée`,
} as const;

export const TEXTES_ECRAN_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_COMPTOIR>> = { fr: TEXTES_ECRAN_COMPTOIR, en: TEXTES_ECRAN_COMPTOIR_ANGLAIS };

export const TEXTES_ECRAN_QR_COMPTOIR = {
  revenir: "Revenir au comptoir",
  titre: "Scanne-moi",
  consigne: "Une fois l'addition payée : onglet Scan → « Scanner le QR du comptoir ».",
  qrLu: (lieu: string) => `QR du comptoir de ${lieu}. Il change toutes les 30 secondes.`,
  tonLieu: "ton lieu",
  eteindre: "Éteindre le QR",
  eteintTitre: "QR éteint",
  eteintTexte: "Tout le monde a scanné, ou les 2 minutes sont passées. Une autre table ? Montre un nouveau QR.",
  chargement: "On allume le comptoir…",
  nouveau: "Montrer un nouveau QR",
} as const;

export const TEXTES_ECRAN_QR_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_ECRAN_QR_COMPTOIR>> = {
  fr: TEXTES_ECRAN_QR_COMPTOIR,
  en: TEXTES_ECRAN_QR_COMPTOIR_ANGLAIS,
};
