import { CLASSE_TITRE_COTE } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EncartDansLApp({ lienApp }: { lienApp: string }) {
  const T = TEXTES_FICHE_LIEU.app;
  return (
    <section aria-labelledby="fiche-app" className="flex flex-col gap-3 rounded-carte bg-encre p-5 text-creme md:px-[26px] md:py-6">
      <h2 id="fiche-app" className={`${CLASSE_TITRE_COTE} text-jaune`}>{T.titre}</h2>
      <p className="text-[15px] leading-relaxed">{T.texte}</p>
      <a
        href={lienApp}
        className="self-start rounded-full bg-jaune px-[18px] py-[11px] text-[15px] font-bold text-encre no-underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-jaune"
      >
        {lierPonctuation(T.bouton)}
      </a>
      <p className="text-sm text-creme/80">{lierPonctuation(T.bientot)}</p>
    </section>
  );
}
