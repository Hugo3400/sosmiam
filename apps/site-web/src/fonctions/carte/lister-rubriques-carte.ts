import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import type { CarteLieu, RubriqueCarte } from "~/types/carte";

function creerAncre(titre: string, rang: number, dejaPrises: Set<string>): string {
  const morceau = normaliserRecherche(titre).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const base = `carte-${morceau || `rubrique-${rang + 1}`}`;
  let ancre = base;
  for (let suite = 2; dejaPrises.has(ancre); suite++) ancre = `${base}-${suite}`;
  dejaPrises.add(ancre);
  return ancre;
}

export function listerRubriquesCarte(carte: CarteLieu | null | undefined): RubriqueCarte[] {
  const dejaPrises = new Set<string>();
  return (carte?.sections ?? [])
    .filter((section) => section.elements.length > 0)
    .map((section, rang) => ({
      id: creerAncre(section.titre, rang, dejaPrises),
      titre: section.titre,
      elements: section.elements,
      alcool: section.elements.some((element) => element.alcool === true),
    }));
}
