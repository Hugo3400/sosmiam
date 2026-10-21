import { Link } from "react-router";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { domainesOffre, typesOffre } from "~/contenus/carriere";
import { formaterDateAParis } from "~/fonctions/dates/formater-date-a-paris";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function CarteOffre({ offre }: { offre: OffreCarriere }) {
  const domaine = domainesOffre[offre.domaine];
  const type = typesOffre.find((t) => t.valeur === offre.type)?.libelle;
  const publiee = formaterDateAParis(offre.publieeLe);
  return (
    <article className="relative flex w-full flex-col rounded-carte border-2 border-encre bg-white p-6 shadow-brut transition-[translate,box-shadow] duration-150 focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-brut-grand hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className={`rounded-full border-2 border-encre px-3 py-0.5 ${offre.type === "benevolat" ? "bg-jaune" : "bg-white"}`}>{type}</span>
        <span className="rounded-full bg-jaune-clair px-3 py-1"><span aria-hidden="true">{domaine.emoji} </span>{domaine.libelle}</span>
      </div>
      <h3 className="mt-4 text-2xl font-extrabold [overflow-wrap:anywhere]">
        <Link to={`/carriere/${offre.id}`} className="after:absolute after:inset-0 after:rounded-carte focus-visible:outline-none">
          {offre.titre}
        </Link>
      </h3>
      <p className="mt-2 grow text-gris [overflow-wrap:anywhere]">{lierPonctuation(offre.resume)}</p>
      <p className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span><span aria-hidden="true">📍 </span>{offre.lieu}{publiee && <span className="text-gris">{` · publiée le ${publiee}`}</span>}</span>
        <span aria-hidden="true" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2">Voir l'offre →</span>
      </p>
    </article>
  );
}
