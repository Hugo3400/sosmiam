import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import type { ElementCarte, FiltreCarte, RubriqueCarte } from "~/types/carte";

function respecteFiltre(element: ElementCarte, filtre: FiltreCarte): boolean {
  if (filtre === "sans-alcool") return element.alcool !== true;
  return element.etiquettes?.includes(filtre) ?? false;
}

export function filtrerRubriquesCarte(rubriques: RubriqueCarte[], recherche: string, filtres: readonly FiltreCarte[]): RubriqueCarte[] {
  const mots = normaliserRecherche(recherche).split(/\s+/).filter(Boolean);
  if (mots.length === 0 && filtres.length === 0) return rubriques;
  return rubriques.flatMap((rubrique) => {
    const titre = normaliserRecherche(rubrique.titre);
    const elements = rubrique.elements.filter((element) => {
      const texte = `${titre} ${normaliserRecherche([element.nom, element.description, element.unite].filter(Boolean).join(" "))}`;
      return mots.every((mot) => texte.includes(mot)) && filtres.every((filtre) => respecteFiltre(element, filtre));
    });
    return elements.length > 0 ? [{ ...rubrique, elements, alcool: elements.some((element) => element.alcool === true) }] : [];
  });
}
