import { PastilleFiltre } from "~/composants/page-lieux/PastilleFiltre";
import { categoriesLieux } from "~/contenus/categories-lieux";
import { TEXTES_PAGE_LIEUX } from "~/contenus/page-lieux";
import { ecrireAdresseLieux } from "~/fonctions/page-lieux/ecrire-adresse-lieux";
import type { CategorieLieu } from "~/types/lieux";

type Props = {
  identifiantVille: string | null;
  type: CategorieLieu | null;
  recherche: string | null;
  total: number | null;
};

export function FiltresTypes({ identifiantVille, type, recherche, total }: Props) {
  const T = TEXTES_PAGE_LIEUX;
  const adresse = (choix: CategorieLieu | null) => ecrireAdresseLieux({ ville: identifiantVille, type: choix, recherche });
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
      <div role="group" aria-labelledby="filtre-type" className="flex flex-wrap items-center gap-2.5">
        <span id="filtre-type" className="mr-1.5 text-sm font-bold">{T.filtres.envieDe}</span>
        <PastilleFiltre vers={adresse(null)} actif={type === null}>{T.filtres.tout}</PastilleFiltre>
        {categoriesLieux.map((categorie) => (
          <PastilleFiltre key={categorie.valeur} vers={adresse(categorie.valeur)} actif={type === categorie.valeur}>
            {categorie.libelle}
          </PastilleFiltre>
        ))}
      </div>
      {total !== null && <p className="text-sm text-gris lg:ml-auto">{T.compte(total)}</p>}
    </div>
  );
}
