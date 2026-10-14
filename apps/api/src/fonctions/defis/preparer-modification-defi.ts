import type { BrouillonDefi, ChampDefi, FiltresDefi } from "../../../../../packages/commun/src/types/defi.ts";
import { validerDefi } from "../../../../../packages/commun/src/validation/valider-defi.ts";
import { CHAMPS_FIGES_APRES_REUSSITE } from "../../services/defis-regles.ts";

type ResultatModification =
  | { ok: true; defi: BrouillonDefi }
  | { ok: false; erreur: "champ-invalide"; champ: ChampDefi }
  | { ok: false; erreur: "defi-deja-reussi" };

/** Les filtres écrits pareil quel que soit l'ordre des clés et des types de lieu */
const ecrireFiltres = (f: FiltresDefi | null) =>
  JSON.stringify(f === null ? null : { typesLieu: f.typesLieu ? [...f.typesLieu].sort() : undefined, apresHeure: f.apresHeure, pendantSos: f.pendantSos, avecPhoto: f.avecPhoto });

/**
 * Une modification du logiciel de gestion (PATCH, `brut` : les champs à changer) : fusionnée avec le défi gardé, puis
 * vérifiée par validerDefi. Si quelqu'un l'a déjà réussi (`reussites` > 0), sa règle ne change plus (mesure, filtres,
 * objectif, premier jour : « defi-deja-reussi ») ; titre, texte, emoji, points (ceux des prochaines réussites), dernier
 * jour, publié et ordre restent permis. Renvoyer la même valeur n'est pas un changement.
 */
export function preparerModificationDefi(existant: BrouillonDefi, reussites: number, brut: unknown): ResultatModification {
  // Pas un objet : comme validerDefi, le premier champ du formulaire est à corriger
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return { ok: false, erreur: "champ-invalide", champ: "emoji" };
  const garde: BrouillonDefi = {
    emoji: existant.emoji, titre: existant.titre, texte: existant.texte, mesure: existant.mesure, filtres: existant.filtres, objectif: existant.objectif,
    points: existant.points, debut: existant.debut, fin: existant.fin, publie: existant.publie, ordre: existant.ordre,
  };
  const resultat = validerDefi({ ...garde, ...brut });
  if (!resultat.ok) return resultat;
  if (reussites > 0) {
    const change = CHAMPS_FIGES_APRES_REUSSITE.some((champ) =>
      champ === "filtres" ? ecrireFiltres(resultat.defi.filtres) !== ecrireFiltres(garde.filtres) : resultat.defi[champ] !== garde[champ],
    );
    if (change) return { ok: false, erreur: "defi-deja-reussi" };
  }
  return resultat;
}
