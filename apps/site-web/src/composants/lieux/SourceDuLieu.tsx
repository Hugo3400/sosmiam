import type { SourceLieu } from "../../../../../packages/commun/src/types/source-lieu.ts";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

type Props = { source: SourceLieu; className?: string };

export function SourceDuLieu({ source, className = "" }: Props) {
  const T = TEXTES_FICHE_LIEU.source;
  return (
    <p className={`text-sm text-gris ${className}`}>
      <span aria-hidden="true">📚 </span>
      {lierPonctuation(T.debut)}
      {source.nom} (
      <a href={source.adresse} rel="noopener" className={classeLien}>{source.site}</a>)
      {source.licence && (
        <>
          {T.licence}
          <a href={source.licence.adresse} rel="noopener" className={classeLien}>{source.licence.nom}</a>
        </>
      )}
      .
    </p>
  );
}
