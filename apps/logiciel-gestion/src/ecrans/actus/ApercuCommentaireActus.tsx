import { TEXTES_ACTUS } from "~/contenus/actus.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import type { CommentaireActusSignale } from "~/services/actus.ts";

const T = TEXTES_ACTUS.commentaire;

export function ApercuCommentaireActus({ commentaire }: { commentaire: CommentaireActusSignale }) {
  return (
    <div className="grid content-start gap-2">
      <p className="text-[13px] text-gris">{T.sur(commentaire.titreArticle, commentaire.auteur, formaterDate(commentaire.ecritLe, true))}</p>
      {commentaire.supprime ? (
        <p className="rounded-xl border border-ligne px-3 py-2 text-sm text-gris">{T.supprime}</p>
      ) : (
        <p className="rounded-xl bg-creme px-3 py-2 text-[15px] whitespace-pre-line">{commentaire.texte}</p>
      )}
    </div>
  );
}
