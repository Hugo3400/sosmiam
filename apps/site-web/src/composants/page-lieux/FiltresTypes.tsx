import { PastilleFiltre } from "~/composants/page-lieux/PastilleFiltre";
import { categoriesLieux, TEXTES_CATEGORIES_LIEUX_PAR_LANGUE } from "~/contenus/categories-lieux";
import { TEXTES_PAGE_LIEUX_PAR_LANGUE } from "~/contenus/page-lieux";
import { ecrireAdresseLieux } from "~/fonctions/page-lieux/ecrire-adresse-lieux";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CategorieLieu } from "~/types/lieux";

type Props = {
  identifiantVille: string | null;
  type: CategorieLieu | null;
  recherche: string | null;
  total: number | null;
};

export function FiltresTypes({ identifiantVille, type, recherche, total }: Props) {
  const T = utiliserTextes(TEXTES_PAGE_LIEUX_PAR_LANGUE);
  const categories = utiliserTextes(TEXTES_CATEGORIES_LIEUX_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const adresse = (choix: CategorieLieu | null) => lien(ecrireAdresseLieux({ ville: identifiantVille, type: choix, recherche }));
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
      <div role="group" aria-labelledby="filtre-type" className="flex flex-wrap items-center gap-2.5">
        <span id="filtre-type" className="mr-1.5 text-sm font-bold">{T.filtres.envieDe}</span>
        <PastilleFiltre vers={adresse(null)} actif={type === null}>{T.filtres.tout}</PastilleFiltre>
        {categoriesLieux.map((categorie) => (
          <PastilleFiltre key={categorie.valeur} vers={adresse(categorie.valeur)} actif={type === categorie.valeur}>
            {categories[categorie.valeur]}
          </PastilleFiltre>
        ))}
      </div>
      {total !== null && <p className="text-sm text-gris lg:ml-auto">{T.compte(total)}</p>}
    </div>
  );
}
