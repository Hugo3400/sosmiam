import { LIMITES_CARTE } from "../regles/carte-du-lieu.ts";
import type { CarteLieu, SectionCarte } from "../types/carte.ts";
import { contientMotInterdit } from "./contient-mot-interdit.ts";
import { validerElementCarte, type ChampElementCarte } from "./valider-element-carte.ts";

export type ChampCarteDuLieu = ChampElementCarte | "titre" | "trop-de-sections" | "trop-d-elements";
export type ResultatCarteDuLieu =
  | { ok: true; carte: CarteLieu }
  | {
      ok: false;
      erreur: "carte-invalide";
      champ: ChampCarteDuLieu;
      /** Où corriger (à partir de 0) : null quand le souci touche toute la carte */
      section: number | null;
      element: number | null;
    };

/**
 * Vérifie la carte d'un lieu envoyée par son gérant (app, site, API) : 20 sections au plus, titres de 1 à 40 caractères
 * sans gros mot, 60 éléments par section et 250 en tout, chaque élément passé par validerElementCarte. Une section vide
 * est permise (le gérant la remplira plus tard ; les gourmands ne la voient pas). La date de mise à jour n'est jamais
 * prise dans la demande : le serveur la pose. Rend la carte nettoyée, ou le premier endroit à corriger.
 */
export function validerCarteDuLieu(brut: unknown): ResultatCarteDuLieu {
  const refuser = (champ: ChampCarteDuLieu, section: number | null = null, element: number | null = null): ResultatCarteDuLieu => ({
    ok: false,
    erreur: "carte-invalide",
    champ,
    section,
    element,
  });
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) return refuser("autre");
  const { sections } = brut as { sections?: unknown };
  if (!Array.isArray(sections)) return refuser("autre");
  if (sections.length > LIMITES_CARTE.sections) return refuser("trop-de-sections");

  const propres: SectionCarte[] = [];
  let total = 0;
  for (const [i, s] of sections.entries()) {
    if (typeof s !== "object" || s === null || Array.isArray(s)) return refuser("autre", i);
    const { titre, elements } = s as { titre?: unknown; elements?: unknown };
    if (typeof titre !== "string") return refuser("titre", i);
    const titrePropre = titre.trim();
    if (!titrePropre || titrePropre.length > LIMITES_CARTE.titreSection || contientMotInterdit(titrePropre)) return refuser("titre", i);
    if (!Array.isArray(elements)) return refuser("autre", i);
    if (elements.length > LIMITES_CARTE.elementsParSection) return refuser("trop-d-elements", i);
    total += elements.length;
    if (total > LIMITES_CARTE.elements) return refuser("trop-d-elements");

    const section: SectionCarte = { titre: titrePropre, elements: [] };
    for (const [j, brutElement] of elements.entries()) {
      const r = validerElementCarte(brutElement);
      if (!r.ok) return refuser(r.champ, i, j);
      section.elements.push(r.element);
    }
    propres.push(section);
  }
  return { ok: true, carte: { sections: propres } };
}
