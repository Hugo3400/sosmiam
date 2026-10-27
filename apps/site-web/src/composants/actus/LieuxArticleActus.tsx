import type { LieuCiteActus } from "../../../../../packages/commun/src/types/actus.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { estLieuAvecFiche } from "~/fonctions/actus/est-lieu-avec-fiche";
import { choisirEmojiLieu } from "~/fonctions/lieux/choisir-emoji-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function LieuxArticleActus({ lieux }: { lieux: readonly LieuCiteActus[] }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  return (
    <section aria-labelledby="lieux-article" className="flex flex-col gap-4">
      <h2 id="lieux-article" className="text-2xl font-extrabold">{A.lieux(lieux.length)}</h2>
      <ul className="flex flex-col gap-3">
        {lieux.map((lieu, rang) => (
          <li key={`${rang}-${lieu.nom}`} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-carte border-2 border-encre bg-white p-3.5 shadow-brut-petit">
            <span aria-hidden="true" className="grid size-[52px] shrink-0 place-items-center rounded-xl border-2 border-encre bg-jaune-clair text-[26px]">
              {choisirEmojiLieu(lieu.emoji)}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p lang="fr" className="font-extrabold">{lieu.nom}</p>
              <p className="text-sm text-gris">
                <span lang="fr">{[lieu.quartier, lieu.ville].filter(Boolean).join(", ")}</span>
                {lieu.verifie && <span className="font-bold text-encre"> · {A.verifie}</span>}
              </p>
            </div>
            {estLieuAvecFiche(lieu) && (
              <Bouton vers={`/lieux/${lieu.id}`} variante="blanc" petit className="shrink-0">
                <span aria-hidden="true">{A.voirFiche}</span>
                <span className="sr-only">{A.voirFicheLu(lieu.nom)}</span>
              </Bouton>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
