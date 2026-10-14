import { ecrireHeure } from "~/fonctions/dates/ecrire-heure";

/** Depuis quand une position partagée n'a pas bougé : « à l'instant », « il y a 3 min », « à 21h30 » (une heure ou plus). */
export function decrireFraicheurPosition(leIso: string, maintenant: Date = new Date()): string {
  const ecart = maintenant.getTime() - new Date(leIso).getTime();
  if (Number.isNaN(ecart)) return "";
  if (ecart < 60_000) return "à l'instant";
  const minutes = Math.floor(ecart / 60_000);
  return minutes < 60 ? `il y a ${minutes} min` : `à ${ecrireHeure(leIso)}`;
}
