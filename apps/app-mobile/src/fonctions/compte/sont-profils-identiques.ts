import type { Profil } from "@sos-miam/commun/types/profil";

/** Le profil en une clé qui ne dépend pas de l'ordre des champs (une liste d'envies vide vaut une liste absente) */
const resumer = (p: Profil) =>
  JSON.stringify([
    p.prenom,
    p.nom ?? "",
    p.pseudo ?? "",
    p.dateNaissance,
    p.ville,
    p.creeLe,
    Object.entries(p.envies)
      .filter(([, liste]) => liste && liste.length > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  ]);

/** Vrai si les deux profils disent exactement la même chose (de quoi éviter une écriture qui ne change rien) */
export function sontProfilsIdentiques(a: Profil, b: Profil): boolean {
  return resumer(a) === resumer(b);
}
