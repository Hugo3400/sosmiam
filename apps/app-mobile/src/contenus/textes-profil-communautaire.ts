import type { ParLangue, Traduction } from "@sos-miam/commun/types/traduction";
import { TEXTES_PROFIL_COMMUNAUTAIRE_ANGLAIS } from "~/contenus/anglais/textes-profil-communautaire";

export const TEXTES_PROFIL_COMMUNAUTAIRE = {
  teSuitLu: (prenom: string) => `${prenom}, te suit`,
  moi: (prenom: string) => `${prenom} (toi)`,
  teSuit: "Te suit",
  pasDePseudo: "Pas encore de pseudo",
  sauvesTitre: "Lieux sauvés",
  sauvesVideMoi: "Pas encore de lieu sauvé : donne une rescousse dans le fil, il t'attendra ici.",
  sauvesVideAutre: (prenom: string) => `${prenom} n'a pas encore sauvé de lieu. Ça viendra !`,
  gardesTitre: "Adresses gardées",
  gardesVideMoi: "Garde une adresse dans le fil : ton futur toi affamé te dira merci.",
  gardesVideAutre: (prenom: string) => `Pas encore d'adresse gardée pour ${prenom}.`,
  palierLu: (estMoi: boolean, palier: string, points: number, pointsDuMois: number) =>
    `${estMoi ? "Ton" : "Son"} palier Ambassadeur : ${palier}, ${points} point${points > 1 ? "s" : ""}, dont ${pointsDuMois} ce mois-ci`,
  palierTitre: "Palier Ambassadeur",
  pointsDuMois: (n: number) => `+${n} ce mois-ci`,
  points: (n: number) => `${n} pts`,
  badgesLu: (n: number) => `Badges obtenus, ${n}`,
  badgesTitre: (n: number) => `Badges (${n})`,
  badgesVideMoi: "Pas encore de badge : ta première rescousse t'en offre un !",
  badgesVideAutre: (prenom: string) => `Pas encore de badge pour ${prenom}.`,
};

export const TEXTES_PROFIL_COMMUNAUTAIRE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_PROFIL_COMMUNAUTAIRE>> = {
  fr: TEXTES_PROFIL_COMMUNAUTAIRE,
  en: TEXTES_PROFIL_COMMUNAUTAIRE_ANGLAIS,
};
