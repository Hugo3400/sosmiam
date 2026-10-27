import { REPONSE_LIEU_ACTUS_MAX } from "../../../../../packages/commun/src/regles/actus.ts";
import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { ReponseLieuARelire } from "~/services/actus.ts";

export function ApercuReponseLieuActus({ reponse }: { reponse: ReponseLieuARelire }) {
  return (
    <div className="grid content-start gap-2">
      <p className="font-titre text-lg font-extrabold">{reponse.lieu.emoji} {reponse.lieu.nom}</p>
      <p className="text-[13px] text-gris">{TEXTES_ACTUS.reponses.sur(reponse.titreArticle, reponse.auteurArticle)} · {formaterDate(reponse.envoyeLe, true)}</p>
      <p className="rounded-xl bg-creme px-3 py-2 text-[15px] whitespace-pre-line">{reponse.texte}</p>
      <p className="chiffres justify-self-end text-xs text-gris">{reponse.texte.length} / {REPONSE_LIEU_ACTUS_MAX}</p>
    </div>
  );
}
