import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";

import { etapesEnvies } from "~/contenus/inscription/envies";
import { filtrerEtapesEnvies } from "~/fonctions/inscription/filtrer-etapes-envies";
import type { BrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

/**
 * Transforme le brouillon de l'inscription en profil à enregistrer, ou null s'il est incomplet (prénom, date, âge minimum, ville).
 * Ne garde que les choix permis à cet âge (pas d'alcool sous 18 ans) et retire les catégories vides.
 */
export function construireProfil(brouillon: BrouillonInscription, maintenant: Date = new Date()): Profil | null {
  if (!brouillon.dateNaissance || !brouillon.ville) return null;
  const permis = filtrerEtapesEnvies(etapesEnvies, calculerAge(brouillon.dateNaissance, maintenant));
  const envies: Partial<Record<CategorieEnvie, string[]>> = {};
  for (const etape of permis) {
    const idsPermis = new Set(etape.choix.map((choix) => choix.id));
    const coches = (brouillon.envies[etape.categorie] ?? []).filter((id) => idsPermis.has(id));
    if (coches.length > 0) envies[etape.categorie] = coches;
  }
  const nom = brouillon.nom.trim();
  const profil: Profil = {
    prenom: brouillon.prenom.trim(),
    ...(nom ? { nom } : {}),
    dateNaissance: brouillon.dateNaissance,
    ville: brouillon.ville,
    envies,
    creeLe: maintenant.toISOString(),
  };
  return estProfilValide(profil) ? profil : null;
}
