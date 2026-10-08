// Libellés des BIG SOS (parcours : docs/decisions.md).
import type { PhaseBigSos } from "~/services/big-sos.ts";

export const PHASES_BIG_SOS: Record<PhaseBigSos, { libelle: string; ton: "jaune" | "vert" | "rouge" | "neutre" | "encre" }> = {
  demande: { libelle: "À étudier", ton: "jaune" },
  verification: { libelle: "Vérification sur place", ton: "jaune" },
  vote: { libelle: "Vote de la communauté", ton: "jaune" },
  programme: { libelle: "Programmé", ton: "encre" },
  "a-la-une": { libelle: "À la une", ton: "rouge" },
  "a-cloturer": { libelle: "Bilan à écrire", ton: "jaune" },
  termine: { libelle: "Terminé", ton: "vert" },
  refuse: { libelle: "Refusé", ton: "neutre" },
};

/** Les étapes affichées en haut d'une fiche, dans l'ordre */
export const ETAPES_BIG_SOS: { phases: PhaseBigSos[]; libelle: string }[] = [
  { phases: ["demande"], libelle: "Demande" },
  { phases: ["verification"], libelle: "Vérification" },
  { phases: ["vote"], libelle: "Vote" },
  { phases: ["programme"], libelle: "Validé" },
  { phases: ["a-la-une"], libelle: "À la une" },
  { phases: ["a-cloturer", "termine"], libelle: "Bilan" },
];

export const ORIGINES_BIG_SOS: Record<string, string> = { lieu: "Demandé par le lieu", ambassadeur: "Proposé par un ambassadeur", equipe: "Créé par l'équipe" };
