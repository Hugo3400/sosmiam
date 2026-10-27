import type { SourceLieu } from "../../../../../packages/commun/src/types/source-lieu.ts";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

type Props = { source: SourceLieu; className?: string };

export function SourceDuLieu({ source, className = "" }: Props) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).source;
  const langue = utiliserLangue();
  return (
    <p className={`text-sm text-gris ${className}`}>
      <span aria-hidden="true">📚 </span>
      {lierPonctuation(T.debut)}
      {langue === "fr" ? source.nom : <span lang="fr">{source.nom}</span>} (
      <a href={source.adresse} rel="noopener" className={classeLien}>{source.site}</a>)
      {source.licence && (
        <>
          {T.licence}
          <a href={source.licence.adresse} rel="noopener" lang={langue === "fr" ? undefined : "fr"} className={classeLien}>{source.licence.nom}</a>
        </>
      )}
      .
    </p>
  );
}
