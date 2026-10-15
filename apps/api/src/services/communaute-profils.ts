import { JOURS_NOUVEAU_DANS_L_APP } from "../../../../packages/commun/src/regles/sorties-miamis.ts";
import type { ChoixGenre } from "../../../../packages/commun/src/types/genre.ts";
import type { ProfilVisibiliteMiamis } from "../../../../packages/commun/src/types/sorties-miamis.ts";
import { calculerAgeProfil } from "../fonctions/comptes/calculer-age-profil.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import type { ChiffrementGenre } from "./chiffrement-communaute.ts";
import type { CompteCommunaute, ContexteCommunaute, TablesCommunaute } from "./communaute-regles.ts";

const CHOIX: readonly ChoixGenre[] = ["femme", "homme", "autre", "ne-pas-dire"];

export function lireChoixGenre(genre: ChiffrementGenre | null, chiffre: string | null | undefined, compteId: number): ChoixGenre | null {
  if (!genre || !chiffre) return null;
  try {
    const choix = genre.dechiffrer(chiffre, compteId);
    return CHOIX.includes(choix as ChoixGenre) ? (choix as ChoixGenre) : null;
  } catch {
    return null;
  }
}

function lireAge(chiffrement: ChiffrementDonnees | null, compte: CompteCommunaute, maintenant: Date): number | null {
  if (!chiffrement || !compte.dateNaissanceChiffree) return null;
  try {
    return calculerAgeProfil(chiffrement.dechiffrer(compte.dateNaissanceChiffree, "dateNaissance"), maintenant);
  } catch {
    return null;
  }
}

export function estNouveauDansLApp(compte: Pick<CompteCommunaute, "creeLe">, maintenant: Date): boolean {
  return maintenant.getTime() - compte.creeLe.getTime() < JOURS_NOUVEAU_DANS_L_APP * 24 * 3_600_000;
}

export function lireNouveaux(comptes: ReadonlyMap<number, CompteCommunaute>, maintenant: Date): Set<number> {
  return new Set([...comptes.values()].filter((c) => estNouveauDansLApp(c, maintenant)).map((c) => c.id));
}

export async function lireProfilsVisibilite(c: ContexteCommunaute, t: TablesCommunaute, ids: readonly number[], maintenant: Date): Promise<Map<number, ProfilVisibiliteMiamis>> {
  const [comptes, genres] = await Promise.all([t.lireComptes(ids), t.lireGenresChiffres(ids)]);
  const profils = new Map<number, ProfilVisibiliteMiamis>();
  for (const compte of comptes.values()) {
    profils.set(compte.id, {
      genre: lireChoixGenre(c.genre, genres.get(compte.id), compte.id),
      age: lireAge(c.chiffrementDonnees, compte, maintenant),
      nouveau: estNouveauDansLApp(compte, maintenant),
      ambassadeur: compte.ambassadeurActif,
    });
  }
  return profils;
}
