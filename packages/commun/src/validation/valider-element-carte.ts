import { ETIQUETTES_CARTE, LIMITES_CARTE } from "../regles/carte-du-lieu.ts";
import type { ElementCarte, EtiquetteCarte } from "../types/carte.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";

export type ChampElementCarte = "nom" | "description" | "prix" | "unite" | "etiquettes" | "autre";
export type ResultatElementCarte = { ok: true; element: ElementCarte } | { ok: false; erreur: "carte-invalide"; champ: ChampElementCarte };

/** Texte facultatif : absent ou vide → undefined ; trop long ou avec un gros mot → false */
function lireTexteFacultatif(valeur: unknown, longueur: number): string | undefined | false {
  if (valeur === undefined || valeur === null) return undefined;
  if (typeof valeur !== "string") return false;
  const propre = valeur.trim();
  if (!propre) return undefined;
  return propre.length <= longueur && !contientMotInterdit(propre) ? propre : false;
}

/**
 * Vérifie un plat, une boisson ou une formule de la carte (app, site, API) : nom de 1 à 80 caractères, description et
 * « pour » (« le verre ») facultatifs, sans gros mot ; prix de 0 à 9 999 €, au centime près ; spécialité et alcool à
 * vrai ou absents ; repères de la liste (sans doublon, rangés). Rend l'élément nettoyé, ou le premier champ à corriger.
 */
export function validerElementCarte(brut: unknown): ResultatElementCarte {
  const refuser = (champ: ChampElementCarte): ResultatElementCarte => ({ ok: false, erreur: "carte-invalide", champ });
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return refuser("autre");
  const e = brut as Record<string, unknown>;

  if (typeof e.nom !== "string") return refuser("nom");
  const nom = e.nom.trim();
  if (!nom || nom.length > LIMITES_CARTE.nom || contientMotInterdit(nom)) return refuser("nom");

  const description = lireTexteFacultatif(e.description, LIMITES_CARTE.description);
  if (description === false) return refuser("description");

  // Au centime près : 4.5 et 4.50 passent, 4.505 non (les flottants de JavaScript tolérés à un millionième)
  const prix = e.prix;
  if (typeof prix !== "number" || !Number.isFinite(prix) || prix < 0 || prix > LIMITES_CARTE.prixMax) return refuser("prix");
  if (Math.abs(Math.round(prix * 100) - prix * 100) > 1e-6) return refuser("prix");

  const unite = lireTexteFacultatif(e.unite, LIMITES_CARTE.unite);
  if (unite === false) return refuser("unite");

  if (e.signature !== undefined && typeof e.signature !== "boolean") return refuser("autre");
  if (e.alcool !== undefined && typeof e.alcool !== "boolean") return refuser("autre");

  let etiquettes: EtiquetteCarte[] = [];
  if (e.etiquettes !== undefined && e.etiquettes !== null) {
    if (!Array.isArray(e.etiquettes) || e.etiquettes.some((x) => !(ETIQUETTES_CARTE as readonly unknown[]).includes(x))) return refuser("etiquettes");
    etiquettes = ETIQUETTES_CARTE.filter((x) => (e.etiquettes as unknown[]).includes(x));
  }

  return {
    ok: true,
    element: {
      nom,
      ...(description ? { description } : {}),
      prix: Math.round(prix * 100) / 100,
      ...(unite ? { unite } : {}),
      ...(e.signature === true ? { signature: true } : {}),
      ...(e.alcool === true ? { alcool: true } : {}),
      ...(etiquettes.length > 0 ? { etiquettes } : {}),
    },
  };
}
