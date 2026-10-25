import { lieuxProposes } from "~/contenus/villes";
import { ecrireIdentifiantVille } from "~/fonctions/page-lieux/ecrire-identifiant-ville";
import { trouverVille } from "~/fonctions/page-lieux/trouver-ville";
import type { VilleLieux } from "~/types/lieux";

export type VilleProche = { ville: VilleLieux; memeCommune: boolean };

export function choisirVilleProche(commune: { commune: string; region: string }, villes: readonly VilleLieux[]): VilleProche | null {
  const memeCommune = trouverVille(commune.commune, villes);
  if (memeCommune) return { ville: memeCommune, memeCommune: true };
  const dansLaRegion = new Set(
    lieuxProposes.filter((lieu) => lieu.type === "ville" && lieu.region === commune.region).map((lieu) => ecrireIdentifiantVille(lieu.nom)),
  );
  const meilleure = villes
    .filter((ville) => dansLaRegion.has(ecrireIdentifiantVille(ville.ville)))
    .reduce<VilleLieux | null>((garde, ville) => (!garde || ville.nombre > garde.nombre ? ville : garde), null);
  return meilleure ? { ville: meilleure, memeCommune: false } : null;
}
