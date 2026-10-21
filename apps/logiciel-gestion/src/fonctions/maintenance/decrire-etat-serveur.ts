import type { EtatProcessus } from "../../services/serveurs.ts";

export function decrireEtatServeur(etat: EtatProcessus, pilotable: boolean): { libelle: string; ton: "vert" | "neutre" | "jaune" | "rouge" } {
  if (etat === "en-ligne") return { libelle: pilotable ? "Allumé" : "En ligne", ton: "vert" };
  if (etat === "arrete") return { libelle: "Éteint", ton: pilotable ? "neutre" : "rouge" };
  if (etat === "en-transition") return { libelle: "Ça bouge…", ton: "jaune" };
  if (etat === "en-erreur") return { libelle: "En erreur", ton: "rouge" };
  if (etat === "absent") return { libelle: "Absent de pm2", ton: "rouge" };
  return { libelle: "État inconnu", ton: "neutre" };
}
