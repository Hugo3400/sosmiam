import type { ReactNode } from "react";

import type { RubriqueActus } from "../../../../../packages/commun/src/regles/actus.ts";
import type { LieuCiteActus } from "../../../../../packages/commun/src/types/actus.ts";
import { FONDS_RUBRIQUES_ACTUS } from "~/composants/actus/fonds-rubriques-actus";
import { ImageArticleActus } from "~/composants/actus/ImageArticleActus";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";

const EMOJIS_MAX = 3;

type Props = {
  rubrique: RubriqueActus;
  lieux: readonly Pick<LieuCiteActus, "emoji">[];
  couverture?: string | null;
  className?: string;
  children?: ReactNode;
};

export function VisuelArticleActus({ rubrique, lieux, couverture = null, className = "", children }: Props) {
  const emojis = [...new Set(lieux.map((lieu) => choisirEmojiLieu(lieu.emoji)))].slice(0, EMOJIS_MAX);
  return (
    <div className={`relative grid shrink-0 place-items-center overflow-hidden ${FONDS_RUBRIQUES_ACTUS[rubrique]} ${className}`}>
      <span aria-hidden="true" className="flex items-center gap-[.15em] leading-none">
        {emojis.map((emoji) => (
          <span key={emoji}>{emoji}</span>
        ))}
      </span>
      {couverture && <ImageArticleActus adresse={couverture} largeur={1200} hauteur={630} className="absolute inset-0 h-full w-full object-cover" />}
      {children}
    </div>
  );
}
