import { Fragment } from "react";

import { MESSAGE_SANITAIRE_ALCOOL } from "~/contenus/legal/prevention";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { ArticleActusSite } from "~/types/actus";

const PARAGRAPHES_AVANT_CITATION = 2;

export function CorpsArticleActus({ article }: { article: Pick<ArticleActusSite, "paragraphes" | "citation" | "alcool"> }) {
  const { paragraphes, citation } = article;
  const placeCitation = Math.min(PARAGRAPHES_AVANT_CITATION, paragraphes.length);
  const blocCitation = citation && (
    <blockquote className="rounded-carte border-2 border-encre bg-jaune-clair px-5 py-4 font-titre text-xl leading-snug font-bold">{lierPonctuation(citation)}</blockquote>
  );
  return (
    <div className="flex flex-col gap-5">
      <div lang="fr" className="flex flex-col gap-5 text-[1.05rem] leading-relaxed">
        {paragraphes.map((paragraphe, rang) => (
          <Fragment key={rang}>
            {rang === placeCitation && blocCitation}
            <p>{lierPonctuation(paragraphe)}</p>
          </Fragment>
        ))}
        {placeCitation === paragraphes.length && blocCitation}
      </div>
      {article.alcool && (
        <p lang="fr" className="rounded-[10px] border-2 border-encre bg-jaune-clair px-4 py-3 font-extrabold">{MESSAGE_SANITAIRE_ALCOOL}</p>
      )}
    </div>
  );
}
