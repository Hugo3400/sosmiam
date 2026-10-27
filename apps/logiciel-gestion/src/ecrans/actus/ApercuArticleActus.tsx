import { Gift, MapPin, Wine } from "lucide-react";

import { MOTS_LUS_PAR_MINUTE } from "../../../../../packages/commun/src/regles/actus.ts";
import { Badge } from "~/composants/interface/Badge.tsx";
import { RUBRIQUES_ACTUS_GESTION, TEXTES_ACTUS as T } from "~/contenus/actus.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { ArticleARelire } from "~/services/actus.ts";

export function ApercuArticleActus({ article }: { article: ArticleARelire }) {
  const rubrique = RUBRIQUES_ACTUS_GESTION[article.rubrique];
  const corps = article.paragraphes.join("\n\n");
  const mots = [article.accroche, corps, article.citation ?? ""].join(" ").split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(mots / MOTS_LUS_PAR_MINUTE));

  return (
    <article className="min-w-0 overflow-hidden rounded-carte border-2 border-encre bg-white">
      {article.couverture
        ? <img src={article.couverture} alt="" className="h-48 w-full object-cover" />
        : <div className="grid h-40 place-items-center bg-creme text-6xl" aria-hidden>{rubrique.emoji}</div>}
      <div className="grid gap-3 p-5">
        <p className="text-[11px] font-extrabold tracking-wide text-gris uppercase">{rubrique.libelle}</p>
        <h2 className="font-titre text-2xl leading-tight font-extrabold">{article.titre}</h2>
        <p className="font-semibold">{article.accroche}</p>
        {article.paragraphes.map((paragraphe, rang) => <p key={rang} className="text-[15px] leading-relaxed">{paragraphe}</p>)}
        {article.citation && <blockquote className="rounded-xl bg-creme px-4 py-3 text-[15px] italic">{article.citation}</blockquote>}
        {article.retouche && article.renvoye && (
          <div className="rounded-xl border border-ligne px-3 py-2 text-[13px]">
            <p className="font-bold">{T.demandeRetouche} ({formaterDate(article.retouche.le, true)})</p>
            <p className="text-gris">« {article.retouche.message} »</p>
          </div>
        )}
        <div className="grid gap-2 border-t border-ligne pt-3">
          <p className="text-sm font-extrabold">{T.lieuxCites}</p>
          <ul className="grid gap-1.5">
            {article.lieux.map((lieu) => (
              <li key={lieu.id} className="flex flex-wrap items-center gap-2 text-sm">
                <MapPin className="size-4 shrink-0 text-gris" aria-hidden />
                <span className="font-semibold">{lieu.emoji} {lieu.nom}</span>
                <span className="text-gris">{lieu.quartier} · {lieu.ville}</span>
                {lieu.verifie && <Badge ton="vert">{T.verifie}</Badge>}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-wrap gap-2">
          {article.collaboration ? <Badge ton="jaune"><Gift className="size-3.5" aria-hidden /> {T.collaboration}</Badge> : <Badge>{T.rienRecu}</Badge>}
          {article.alcool && <Badge ton="rouge"><Wine className="size-3.5" aria-hidden /> {T.alcool}</Badge>}
          {article.finLe && <Badge ton="contour">{T.finLe(formaterDate(article.finLe))}</Badge>}
        </div>
        <p className="text-[13px] text-gris">
          {T.photos(article.photos)} · {T.caracteres(corps.length)} · {T.lecture(minutes)}
          <br />
          {article.auteur.prenom}{article.auteur.ambassadeur ? ` · ${T.ambassadeur}` : ""} · {article.auteur.ville} · {T.envoye(formaterDate(article.envoyeLe, true))}
        </p>
      </div>
    </article>
  );
}
