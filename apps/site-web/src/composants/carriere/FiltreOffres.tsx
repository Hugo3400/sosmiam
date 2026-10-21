import { Link } from "react-router";

import type { OffreCarriere, TypeOffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { typesOffre } from "~/contenus/carriere";

type Props = { offres: OffreCarriere[]; type: TypeOffreCarriere | null };

const classePastille = [
  "inline-flex items-center gap-2 rounded-full border-2 border-encre px-4 py-1.5 font-semibold transition-colors",
  "focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre",
].join(" ");

export function FiltreOffres({ offres, type }: Props) {
  const choix = [
    { valeur: null, libelle: "Toutes", nombre: offres.length },
    ...typesOffre.map((t) => ({ valeur: t.valeur, libelle: t.libelle, nombre: offres.filter((offre) => offre.type === t.valeur).length })),
  ];
  return (
    <nav aria-label="Filtrer les offres" className="mt-6">
      <ul className="flex flex-wrap gap-2.5">
        {choix.map((un) => {
          const actif = un.valeur === type;
          return (
            <li key={un.libelle}>
              <Link
                to={un.valeur ? `/carriere?type=${un.valeur}#offres` : "/carriere#offres"}
                replace
                preventScrollReset
                aria-current={actif ? "true" : undefined}
                className={`${classePastille} ${actif ? "bg-encre text-jaune" : "bg-white hover:bg-jaune-clair"}`}
              >
                {actif && <span aria-hidden="true">✓</span>}
                {un.libelle}
                <span className={`rounded-full px-2 text-sm ${actif ? "bg-jaune text-encre" : "bg-jaune-clair"}`}>
                  {un.nombre}<span className="sr-only">{un.nombre > 1 ? " offres" : " offre"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
