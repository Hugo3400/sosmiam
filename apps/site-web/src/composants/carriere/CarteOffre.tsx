import { Link } from "react-router";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { EMOJIS_DOMAINES, TEXTES_CARRIERE_PAR_LANGUE } from "~/contenus/carriere";
import { ecrireDateAParisLangue } from "~/fonctions/dates/ecrire-date-a-paris-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function CarteOffre({ offre }: { offre: OffreCarriere }) {
  const T = utiliserTextes(TEXTES_CARRIERE_PAR_LANGUE);
  const langue = utiliserLangue();
  const lien = utiliserLienLangue();
  const langueOffre = langue === "fr" ? undefined : "fr";
  const publiee = ecrireDateAParisLangue(offre.publieeLe, langue);
  return (
    <article className="relative flex w-full flex-col rounded-carte border-2 border-encre bg-white p-6 shadow-brut transition-[translate,box-shadow] duration-150 focus-within:-translate-x-0.5 focus-within:-translate-y-0.5 focus-within:shadow-brut-grand hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <span className={`rounded-full border-2 border-encre px-3 py-0.5 ${offre.type === "benevolat" ? "bg-jaune" : "bg-white"}`}>{T.types[offre.type].libelle}</span>
        <span className="rounded-full bg-jaune-clair px-3 py-1"><span aria-hidden="true">{EMOJIS_DOMAINES[offre.domaine]} </span>{T.domaines[offre.domaine]}</span>
      </div>
      <h3 lang={langueOffre} className="mt-4 text-2xl font-extrabold [overflow-wrap:anywhere]">
        <Link to={lien(`/carriere/${offre.id}`)} className="after:absolute after:inset-0 after:rounded-carte focus-visible:outline-none">
          {offre.titre}
        </Link>
      </h3>
      <p lang={langueOffre} className="mt-2 grow text-gris [overflow-wrap:anywhere]">{lierPonctuation(offre.resume)}</p>
      <p className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <span><span aria-hidden="true">📍 </span><span lang={langueOffre}>{offre.lieu}</span>{publiee && <span className="text-gris">{T.carte.publiee(publiee)}</span>}</span>
        <span aria-hidden="true" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2">{T.carte.voirOffre}</span>
      </p>
    </article>
  );
}
