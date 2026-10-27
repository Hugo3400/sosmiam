import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import { MOTIFS_MODERATION } from "~/contenus/motifs-moderation.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { ArticleARelire } from "~/services/actus.ts";

const T = TEXTES_ACTUS.suivi;

export function SuiviArticleActus({ article }: { article: ArticleARelire }) {
  return (
    <div className="grid content-start gap-3 rounded-2xl border-2 border-encre bg-white p-4 text-sm">
      {article.statut === "a-retoucher" && article.retouche && (
        <>
          <p className="font-bold">{T.retouche(formaterDate(article.retouche.le, true))}</p>
          <p className="rounded-xl bg-creme px-3 py-2">« {article.retouche.message} »</p>
        </>
      )}
      {article.statut === "publie" && article.publieLe && <p className="font-bold">{T.publie(formaterDate(article.publieLe, true))}</p>}
      {article.statut === "refuse" && article.refus && (
        <>
          <p className="font-bold">{T.refuse(formaterDate(article.refus.le, true))}</p>
          <p>{T.regle(MOTIFS_MODERATION[article.refus.motif]?.libelle ?? article.refus.motif)}</p>
          <p className="rounded-xl bg-creme px-3 py-2">« {article.refus.motivation} »</p>
          {article.refus.contestation && (
            <>
              <p className="font-bold">{T.contestation}</p>
              <p className="rounded-xl bg-jaune-clair px-3 py-2">« {article.refus.contestation} »</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
