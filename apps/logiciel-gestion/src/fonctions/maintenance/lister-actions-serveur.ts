import type { ActionServeur, ServeurSuivi } from "../../services/serveurs.ts";

export function listerActionsServeur(serveur: Pick<ServeurSuivi, "pilotable" | "etat">): ActionServeur[] {
  if (!serveur.pilotable) return [];
  if (serveur.etat === "en-ligne") return ["eteindre", "redemarrer"];
  if (serveur.etat === "arrete" || serveur.etat === "en-erreur") return ["allumer"];
  return [];
}
