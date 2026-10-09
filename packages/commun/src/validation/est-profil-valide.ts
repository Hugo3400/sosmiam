import type { Profil } from "../types/profil.ts";
import { AGE_MINIMUM_INSCRIPTION } from "../regles/ages.ts";
import { calculerAge } from "../regles/calculer-age.ts";
import { estPseudoValide } from "./est-pseudo-valide.ts";

/**
 * Vérifie qu'une donnée lue (téléphone, plus tard API) est bien un profil complet et cohérent :
 * prénom, date de naissance valide et âge minimum, ville, envies sous forme de listes de textes.
 */
export function estProfilValide(donnee: unknown): donnee is Profil {
  if (typeof donnee !== "object" || donnee === null) return false;
  const p = donnee as Record<string, unknown>;
  if (typeof p.prenom !== "string" || p.prenom.trim() === "" || p.prenom.length > 40) return false;
  if (p.nom !== undefined && typeof p.nom !== "string") return false;
  if (p.pseudo !== undefined && !estPseudoValide(p.pseudo)) return false;
  if (typeof p.ville !== "string" || p.ville === "") return false;
  if (typeof p.creeLe !== "string") return false;
  if (typeof p.dateNaissance !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(p.dateNaissance)) return false;
  if (calculerAge(p.dateNaissance) < AGE_MINIMUM_INSCRIPTION) return false;
  if (typeof p.envies !== "object" || p.envies === null) return false;
  return Object.values(p.envies).every((liste) => Array.isArray(liste) && liste.every((id) => typeof id === "string"));
}
