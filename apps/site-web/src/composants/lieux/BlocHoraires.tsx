import { CLASSE_TITRE_COTE } from "~/composants/lieux/classes-fiche-lieu";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";

export function BlocHoraires({ horaires }: { horaires: string }) {
  return (
    <section aria-labelledby="fiche-horaires" className="flex flex-col gap-2.5 rounded-carte border-2 border-encre bg-white p-5 md:px-[26px] md:py-6">
      <h2 id="fiche-horaires" className={CLASSE_TITRE_COTE}>{TEXTES_FICHE_LIEU.horaires}</h2>
      <p lang="fr" className="text-[15px] font-semibold whitespace-pre-line [overflow-wrap:anywhere]">{horaires.trim()}</p>
    </section>
  );
}
