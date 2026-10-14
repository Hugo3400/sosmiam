import type { CategorieEnvie, Profil } from "@sos-miam/commun/types/profil";
import { estProfilValide } from "@sos-miam/commun/validation/est-profil-valide";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";

import { etapesEnvies } from "~/contenus/inscription/envies";
import type { BrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

/**
 * Transforme le brouillon de l'inscription en profil à enregistrer, ou null s'il est incomplet (prénom, date, âge minimum, ville).
 * Ne garde que les choix qui existent encore (ids connus) et retire les catégories vides.
 * Le pseudo (obligatoire dans « Fais connaissance ») n'est gardé que s'il a la bonne forme : sinon, il se choisira dans les réglages.
 */
export function construireProfil(brouillon: BrouillonInscription, maintenant: Date = new Date()): Profil | null {
  if (!brouillon.dateNaissance || !brouillon.ville) return null;
  const envies: Partial<Record<CategorieEnvie, string[]>> = {};
  for (const etape of etapesEnvies) {
    const idsPermis = new Set(etape.choix.map((choix) => choix.id));
    const coches = (brouillon.envies[etape.categorie] ?? []).filter((id) => idsPermis.has(id));
    if (coches.length > 0) envies[etape.categorie] = coches;
  }
  const nom = brouillon.nom.trim();
  const pseudo = brouillon.pseudo.trim();
  const profil: Profil = {
    prenom: brouillon.prenom.trim(),
    ...(nom ? { nom } : {}),
    ...(estPseudoValide(pseudo) ? { pseudo } : {}),
    dateNaissance: brouillon.dateNaissance,
    ville: brouillon.ville,
    envies,
    creeLe: maintenant.toISOString(),
  };
  return estProfilValide(profil) ? profil : null;
}
