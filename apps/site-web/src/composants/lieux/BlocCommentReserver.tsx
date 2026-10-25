import { CLASSE_TITRE_COTE } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { creerLienTelephone } from "~/fonctions/lieux/creer-lien-telephone";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePublique } from "~/types/pro";

export function BlocCommentReserver({ lieu }: { lieu: FichePublique }) {
  const T = TEXTES_FICHE_LIEU.commentReserver;
  const lienSite = lieu.siteWeb;
  if (!lienSite && !lieu.telephone) return null;
  return (
    <section aria-labelledby="fiche-reserver" className="flex flex-col gap-2.5 rounded-carte bg-encre p-5 text-creme md:px-[30px] md:py-7">
      <h2 id="fiche-reserver" className={`${CLASSE_TITRE_COTE} text-jaune`}>{T.titre}</h2>
      <p className="text-[15px] leading-relaxed">{lierPonctuation(T.texte)}</p>
      <a
        href={lienSite ?? creerLienTelephone(lieu.telephone ?? "")}
        rel={lienSite ? "noopener nofollow" : undefined}
        className="mt-1 self-start rounded-full bg-jaune px-4 py-2.5 text-[15px] font-bold text-encre no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-jaune"
      >
        {lienSite ? T.site : T.telephone}
      </a>
    </section>
  );
}
