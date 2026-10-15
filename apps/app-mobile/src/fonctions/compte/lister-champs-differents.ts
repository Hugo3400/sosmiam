import type { ProfilServeur } from "@sos-miam/commun/types/compte-app";
import type { Profil } from "@sos-miam/commun/types/profil";
import type { ChampSynchro } from "~/stockage/synchro-profil";

/** Mêmes choix des deux côtés, dans n'importe quel ordre (une liste absente vaut une liste vide) */
function memesChoix(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  const gauche = new Set(a ?? []);
  const droite = new Set(b ?? []);
  return gauche.size === droite.size && [...gauche].every((id) => droite.has(id));
}

/**
 * Les champs où le téléphone et le serveur ne disent pas la même chose : prénom, nom, ville et envies (comparées comme des
 * ensembles, sans les régimes, qui ne vont jamais au serveur). Ni le pseudo (règles à part), ni la date de naissance.
 */
export function listerChampsDifferents(local: Profil, serveur: ProfilServeur): ChampSynchro[] {
  const champs: ChampSynchro[] = [];
  if (local.prenom !== serveur.prenom) champs.push("prenom");
  if ((local.nom ?? "").trim() !== (serveur.nom ?? "")) champs.push("nom");
  if (local.ville !== serveur.ville) champs.push("ville");
  const categories = new Set([...Object.keys(local.envies), ...Object.keys(serveur.envies)].filter((c) => c !== "regimes"));
  const enviesLocales: Record<string, string[] | undefined> = local.envies;
  if ([...categories].some((c) => !memesChoix(enviesLocales[c], serveur.envies[c]))) champs.push("envies");
  return champs;
}
