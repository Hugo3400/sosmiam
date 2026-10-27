import { useState } from "react";
import { Link } from "react-router";

import { TitreSection } from "~/composants/interface/TitreSection";
import { AucunLieu } from "~/composants/lieux/AucunLieu";
import { CarteLieu } from "~/composants/lieux/CarteLieu";
import { Section } from "~/composants/mise-en-page/Section";
import { categoriesLieux, TEXTES_CATEGORIES_LIEUX_PAR_LANGUE } from "~/contenus/categories-lieux";
import { TEXTES_ILS_ONT_BESOIN_DE_TOI_PAR_LANGUE } from "~/contenus/ils-ont-besoin-de-toi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { CategorieLieu, LieuCarte } from "~/types/lieux";

type Props = {
  lieux: LieuCarte[] | null;
  nombreLieux: number | null;
  tirage: boolean;
};

/**
 * Les vrais lieux publiés (lus par l'accueil auprès de l'API), filtrables par catégorie.
 * Aucun lieu inventé : s'il n'y en a pas encore, ou si la liste ne peut pas être lue, on l'affiche franchement.
 */
export function IlsOntBesoinDeToi({ lieux, nombreLieux, tirage }: Props) {
  const T = utiliserTextes(TEXTES_ILS_ONT_BESOIN_DE_TOI_PAR_LANGUE);
  const libelles = utiliserTextes(TEXTES_CATEGORIES_LIEUX_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const [filtre, setFiltre] = useState<CategorieLieu | "tous">("tous");
  const javascriptActif = utiliserJavascriptActif();
  const presentes = categoriesLieux
    .filter((categorie) => lieux?.some((lieu) => lieu.type === categorie.valeur))
    .map(({ valeur }) => ({ valeur, libelle: libelles[valeur] }));
  const visibles = (lieux ?? []).filter((lieu) => !javascriptActif || filtre === "tous" || lieu.type === filtre);
  const filtres = [{ valeur: "tous" as const, libelle: T.tout }, ...presentes];

  return (
    <Section id="adresses" fond="creme">
      <TitreSection chapo={T.chapo}>{T.titre}</TitreSection>

      {!lieux || lieux.length === 0 ? (
        <AucunLieu indisponible={lieux === null} />
      ) : (
        <>
          {/* Filtres seulement s'il y a plusieurs catégories, et seulement celles qui ont des lieux */}
          {javascriptActif && presentes.length > 1 && (
            <div className="mb-9 flex flex-wrap justify-center gap-2.5" role="group" aria-label={T.filtres}>
              {filtres.map((categorie) => (
                <button
                  key={categorie.valeur}
                  type="button"
                  aria-pressed={filtre === categorie.valeur}
                  onClick={() => setFiltre(categorie.valeur)}
                  className={`rounded-full border-2 border-encre px-[22px] py-2.5 text-[.95rem] font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre
                    ${filtre === categorie.valeur ? "bg-encre text-jaune" : "bg-white hover:bg-jaune-clair"}`}
                >
                  {categorie.libelle}
                </button>
              ))}
            </div>
          )}
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibles.map((lieu) => (
              <li key={lieu.id}>
                <CarteLieu lieu={lieu} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex flex-col items-center gap-3 text-center">
        <Link
          to={lien("/lieux")}
          className="inline-flex items-center gap-2.5 rounded-full border-2 border-encre bg-jaune px-[30px] py-[15px] text-[1.05rem] font-bold text-encre shadow-brut transition-[translate,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
        >
          {T.voirTous(nombreLieux)}
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
        {tirage && lieux && lieux.length > 0 && <p className="max-w-xl text-sm text-gris">{lierPonctuation(T.tirage)}</p>}
      </div>
    </Section>
  );
}
