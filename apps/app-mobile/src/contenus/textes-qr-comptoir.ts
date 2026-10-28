import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_QR_COMPTOIR_ANGLAIS } from "~/contenus/anglais/textes-qr-comptoir";

export const TEXTES_QR_COMPTOIR = {
  montrerLu: "Montrer le QR du comptoir",
  montrerIndice: "Après le paiement : le client le scanne et sa visite compte. Tu choisis pour combien de personnes.",
  montrer: "Montrer le QR",
  montrerDetail: "Une fois payé, pour 1 à 12 personnes. Il change toutes les 30 s.",
  feuilleSousTitre: "Il change toutes les 30 s et s'éteint après 2 minutes, ou quand tout le monde a scanné.",
  montrerPour: (personnes: number) => `Montrer le QR · ${personnes} personne${personnes > 1 ? "s" : ""}`,
  pourCombien: "Pour combien de personnes ?",
  nombreLu: "Nombre de personnes",
  personnes: (n: number) => `${n} personne${n > 1 ? "s" : ""}`,
  allumeLu: (restantes: number, personnes: number, reste: string) =>
    `QR allumé : ${restantes} scan${restantes > 1 ? "s" : ""} sur ${personnes} restant${restantes > 1 ? "s" : ""}, il s'éteint dans ${reste}`,
  allume: "QR allumé",
  allumeDetail: (restantes: number, personnes: number, reste: string) =>
    `${restantes} scan${restantes > 1 ? "s" : ""} sur ${personnes} restant${restantes > 1 ? "s" : ""} · s'éteint dans ${reste}`,
  voirLu: "Voir le QR en grand",
  voir: "Voir le QR",
  eteindreLu: "Éteindre le QR",
  eteindre: "Éteindre",
  resume: (restantes: number, personnes: number, reste: string) =>
    `${restantes} scan${restantes > 1 ? "s" : ""} restant${restantes > 1 ? "s" : ""} sur ${personnes} · s'éteint dans ${reste}`,
  dejaScanne: (noms: string) => `Déjà scanné : ${noms}`,
  personne: "Personne n'a encore scanné.",
};

export const TEXTES_QR_COMPTOIR_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_QR_COMPTOIR>> = { fr: TEXTES_QR_COMPTOIR, en: TEXTES_QR_COMPTOIR_ANGLAIS };
