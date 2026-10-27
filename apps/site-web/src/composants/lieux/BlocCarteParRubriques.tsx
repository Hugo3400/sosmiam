import { Link } from "react-router";

import { carteContientAlcool } from "../../../../../packages/commun/src/fonctions/prevention/carte-contient-alcool.ts";
import { BlocPrevention } from "~/composants/lieux/BlocPrevention";
import { CLASSE_BLOC, CLASSE_TITRE_BLOC } from "~/composants/lieux/classes-fiche-lieu";
import { ElementCarteDuLieu } from "~/composants/lieux/ElementCarteDuLieu";
import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { OngletsCarte } from "~/composants/lieux/OngletsCarte";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { listerRubriquesCarte } from "~/fonctions/carte/lister-rubriques-carte";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CarteLieu } from "~/types/carte";
import type { CategorieLieu } from "~/types/lieux";

type Props = { carte: CarteLieu; type: CategorieLieu; lieuId: number };

export function BlocCarteParRubriques({ carte, type, lieuId }: Props) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).carte;
  const langue = utiliserLangue();
  const javascriptActif = utiliserJavascriptActif();
  const rubriques = listerRubriquesCarte(carte);
  if (rubriques.length === 0) return null;
  const date = carte.majLe ? ecrireDateAParisLangue(carte.majLe, langue) : null;
  return (
    <div className="flex flex-col gap-6 md:gap-7">
      <section aria-labelledby="fiche-carte" className={`flex flex-col gap-[18px] ${CLASSE_BLOC}`}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-3">
          <h2 id="fiche-carte" className={CLASSE_TITRE_BLOC}>{type === "sortie" ? T.titre.formules : T.titre.carte}</h2>
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2">
            {date && <p className="text-[13px] text-gris">{T.majLe(date)}</p>}
            <Link
              to={`/lieux/${lieuId}/carte`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-3.5 py-2 text-sm font-bold text-encre shadow-brut-petit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
            >
              <IconeFiche nom="agrandir" className="h-4 w-4" />
              {T.voirTout}
            </Link>
          </div>
        </div>
        {javascriptActif && rubriques.length > 1 ? (
          <OngletsCarte rubriques={rubriques} />
        ) : (
          <div lang="fr" className="grid gap-6">
            {rubriques.map((rubrique) => (
              <div key={rubrique.id}>
                <h3 className="border-b-2 border-encre pb-1 font-titre text-lg font-extrabold [overflow-wrap:anywhere]">{rubrique.titre}</h3>
                <ul>
                  {rubrique.elements.map((element, rang) => <ElementCarteDuLieu key={`${rang}-${element.nom}`} element={element} />)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
      {carteContientAlcool(carte) && <BlocPrevention />}
    </div>
  );
}
