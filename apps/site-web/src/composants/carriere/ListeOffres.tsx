import { useSearchParams } from "react-router";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { CarteOffre } from "~/composants/carriere/CarteOffre";
import { EtatSansOffre } from "~/composants/carriere/EtatSansOffre";
import { FiltreOffres } from "~/composants/carriere/FiltreOffres";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { choisirTypeOffre } from "~/fonctions/carriere/choisir-type-offre";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function ListeOffres({ offres }: { offres: OffreCarriere[] | null }) {
  const T = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE).liste;
  const [parametres] = useSearchParams();
  const type = choisirTypeOffre(parametres.get("type"));
  const affichees = offres?.filter((offre) => !type || offre.type === type) ?? [];

  return (
    <Section id="offres" fond="creme">
      <TitreSection aGauche>{T.titre}</TitreSection>
      {offres === null && <EtatSansOffre cas="indisponible" />}
      {offres !== null && offres.length === 0 && <EtatSansOffre cas="vide" />}
      {offres !== null && offres.length > 0 && (
        <>
          <FiltreOffres offres={offres} type={type} />
          <p role="status" className="sr-only">{T.affichees(affichees.length)}</p>
          {affichees.length === 0 && type ? (
            <EtatSansOffre cas="filtre-vide" type={type} />
          ) : (
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {affichees.map((offre) => <li key={offre.id} className="flex"><CarteOffre offre={offre} /></li>)}
            </ul>
          )}
        </>
      )}
    </Section>
  );
}
