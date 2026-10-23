import type { SourceLieu } from "../../../../../packages/commun/src/types/source-lieu.ts";

export function ecrireLigneSourceLieu(source: SourceLieu): string {
  return source.licence
    ? `📚 Texte et infos : ${source.nom} (${source.site}), sous ${source.licence.nom}.`
    : `📚 Texte et infos : ${source.nom} (${source.site}).`;
}
