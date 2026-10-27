import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { formaterHeureCourteLangue } from "~/fonctions/dates/formater-heure-courte-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { SosLieu } from "../../../../../packages/commun/src/types/lieu.ts";

export function BandeauSos({ sos, lienApp }: { sos: SosLieu; lienApp: string }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).sos;
  const langue = utiliserLangue();
  return (
    <section aria-labelledby="fiche-sos" className="flex flex-col gap-5 rounded-carte border-[3px] border-rouge-sos bg-rose-alerte p-5 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8 md:py-[26px]">
      <div className="flex min-w-0 flex-col gap-1.5">
        <h2 id="fiche-sos" className="flex flex-col gap-1.5">
          <span className="font-texte text-sm font-extrabold tracking-[.5px] text-rouge-texte uppercase">{T.surtitre}</span>
          <span className="font-titre text-[26px] font-extrabold md:text-[30px]">{T.places(sos.places, formaterHeureCourteLangue(sos.jusqua, langue))}</span>
        </h2>
        {sos.offre && <p lang="fr" className="[overflow-wrap:anywhere]">{lierPonctuation(sos.offre)}</p>}
      </div>
      <a
        href={lienApp}
        className="inline-flex shrink-0 items-center justify-center self-start rounded-full border-2 border-encre bg-jaune px-6 py-3.5 font-bold text-encre shadow-brut transition-[translate,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre md:self-center"
      >
        {lierPonctuation(T.bouton)}
      </a>
    </section>
  );
}
