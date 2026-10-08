// Statuts d'une fiche de lieu, tels qu'affichés dans le logiciel.
import type { StatutLieu } from "~/services/lieux.ts";

export const STATUTS_LIEU: Record<StatutLieu, { libelle: string; ton: "vert" | "neutre" | "rouge" }> = {
  publie: { libelle: "En ligne", ton: "vert" },
  brouillon: { libelle: "Brouillon", ton: "neutre" },
  masque: { libelle: "Masqué", ton: "rouge" },
};

export const TYPES_LIEU: Record<string, string> = { resto: "Resto", patisserie: "Pâtisserie", bar: "Bar", sortie: "Sortie" };
