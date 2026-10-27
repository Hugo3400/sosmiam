import { Link } from "react-router";

import type { OffreCarriere, TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { TEXTES_CARRIERE_PAR_LANGUE, TYPES_OFFRE } from "~/contenus/carriere";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = { offres: OffreCarriere[]; type: TypeOffreCarriere | null };

const classePastille = [
  "inline-flex items-center gap-2 rounded-full border-2 border-encre px-4 py-1.5 font-semibold transition-colors",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre",
].join(" ");

export function FiltreOffres({ offres, type }: Props) {
  const T = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const choix = [
    { valeur: null, libelle: T.liste.toutes, nombre: offres.length },
    ...TYPES_OFFRE.map((valeur) => ({ valeur, libelle: T.types[valeur].libelle, nombre: offres.filter((offre) => offre.type === valeur).length })),
  ];
  return (
    <nav aria-label={T.liste.filtrer} className="mt-6">
      <ul className="flex flex-wrap gap-2.5">
        {choix.map((un) => {
          const actif = un.valeur === type;
          return (
            <li key={un.libelle}>
              <Link
                to={lien(un.valeur ? `/carriere?type=${un.valeur}#offres` : "/carriere#offres")}
                replace
                preventScrollReset
                aria-current={actif ? "true" : undefined}
                className={`${classePastille} ${actif ? "bg-encre text-jaune" : "bg-white hover:bg-jaune-clair"}`}
              >
                {actif && <span aria-hidden="true">✓</span>}
                {un.libelle}
                <span className={`rounded-full px-2 text-sm ${actif ? "bg-jaune text-encre" : "bg-jaune-clair"}`}>
                  {un.nombre}<span className="sr-only">{T.liste.nombreOffres(un.nombre)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
