import { useId } from "react";

import type { ReponseLieuActus } from "../../../../../packages/commun/src/types/actus.ts";
import { LienSignalerActus } from "~/composants/actus/LienSignalerActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function MotDuLieuActus({ articleId, reponse }: { articleId: number; reponse: ReponseLieuActus }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  const idTitre = useId();
  return (
    <section aria-labelledby={idTitre} className="flex flex-col gap-2 rounded-carte border-2 border-dashed border-encre bg-white p-5">
      <h2 id={idTitre} className="text-lg font-extrabold">{A.motDuLieu}</h2>
      <p lang="fr" className="font-bold">{reponse.nomLieu}</p>
      <p lang="fr" className="leading-relaxed">{lierPonctuation(reponse.texte)}</p>
      <p className="text-sm text-gris">{A.reponseRelue}</p>
      <LienSignalerActus vers={`/actus/${articleId}/signaler?lieu=${reponse.lieuId}`}>
        {A.signaler.reponse}
        <span className="sr-only">{A.signaler.reponseDe(reponse.nomLieu)}</span>
      </LienSignalerActus>
    </section>
  );
}
