import { calculerDistanceMetres } from "../../../../../packages/commun/src/fonctions/geo/calculer-distance-metres.ts";
import { normaliserNomCommune } from "../geo/normaliser-nom-commune.ts";
import { simplifierNomLieu } from "./simplifier-nom-lieu.ts";

export type LieuComparable = { id: number; nom: string; ville: string; adresse: string | null; latitude: number | null; longitude: number | null };
export type GroupeDoublons = { ids: number[]; raison: "meme-nom" | "meme-adresse" | "meme-nom-proche" };

/** Deux lieux du même nom à moins de 1 km sont le même, même si leur ville est écrite autrement (Montpellier / Castelnau) */
const PROCHE_M = 1000;

/**
 * Les groupes de lieux qui sont sans doute le même : même nom (« Restaurant Le 140 » = « Le 140 ») dans la même ville,
 * même nom à moins de 1 km, ou même adresse dans la même ville. Chaque lieu n'est que dans un groupe ; groupes de 2 ou plus.
 */
export function trouverDoublonsLieux(lieux: LieuComparable[]): GroupeDoublons[] {
  const groupes: GroupeDoublons[] = [];
  const pris = new Set<number>();
  const ajouter = (ids: number[], raison: GroupeDoublons["raison"]) => {
    const libres = ids.filter((id) => !pris.has(id));
    if (libres.length < 2) return;
    libres.forEach((id) => pris.add(id));
    groupes.push({ ids: libres, raison });
  };
  const regrouper = (cle: (lieu: LieuComparable) => string | null, raison: GroupeDoublons["raison"]) => {
    const parCle = new Map<string, number[]>();
    for (const lieu of lieux) {
      const valeur = cle(lieu);
      if (valeur) parCle.set(valeur, [...(parCle.get(valeur) ?? []), lieu.id]);
    }
    for (const ids of parCle.values()) ajouter(ids, raison);
  };
  const ville = (lieu: LieuComparable) => normaliserNomCommune(lieu.ville);
  regrouper((lieu) => `${simplifierNomLieu(lieu.nom)}|${ville(lieu)}`, "meme-nom");
  regrouper((lieu) => (lieu.adresse && normaliserNomCommune(lieu.adresse).length > 5 ? `${normaliserNomCommune(lieu.adresse)}|${ville(lieu)}` : null), "meme-adresse");
  // Même nom, villes écrites autrement, mais à moins de 1 km (comparés seulement entre lieux du même nom)
  const parNom = new Map<string, LieuComparable[]>();
  for (const lieu of lieux) {
    if (lieu.latitude === null || lieu.longitude === null) continue;
    const nom = simplifierNomLieu(lieu.nom);
    parNom.set(nom, [...(parNom.get(nom) ?? []), lieu]);
  }
  for (const homonymes of parNom.values()) {
    for (let i = 0; i < homonymes.length; i++) {
      for (let j = i + 1; j < homonymes.length; j++) {
        const [a, b] = [homonymes[i]!, homonymes[j]!];
        const distance = calculerDistanceMetres({ latitude: a.latitude!, longitude: a.longitude! }, { latitude: b.latitude!, longitude: b.longitude! });
        if (distance < PROCHE_M) ajouter([a.id, b.id], "meme-nom-proche");
      }
    }
  }
  return groupes;
}
