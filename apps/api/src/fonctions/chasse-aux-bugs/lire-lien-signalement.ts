import { LONGUEURS_SIGNALEMENT_SECURITE } from "../../../../../packages/commun/src/regles/securite.ts";
import { lireTexteSignalement } from "./lire-texte-signalement.ts";

export function lireLienSignalement(valeur: unknown): string | null | undefined {
  if (valeur === undefined || valeur === null || (typeof valeur === "string" && valeur.trim() === "")) return null;
  const lien = lireTexteSignalement(valeur, 1, LONGUEURS_SIGNALEMENT_SECURITE.lien.max);
  if (lien === null || !/^https:\/\/\S+$/i.test(lien)) return undefined;
  try {
    const adresse = new URL(lien);
    return adresse.protocol === "https:" && adresse.hostname.includes(".") && !adresse.username && !adresse.password ? lien : undefined;
  } catch {
    return undefined;
  }
}
