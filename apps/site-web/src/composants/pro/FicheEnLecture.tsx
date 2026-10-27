import { BlocInfosPratiques } from "~/composants/lieux/BlocInfosPratiques";
import { TEXTES_FICHE_PRO_PAR_LANGUE } from "~/contenus/fiche-pro";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FichePro } from "~/types/pro";

/** La fiche vue par un membre de l'équipe : tout se lit, seul le gérant modifie. */
export function FicheEnLecture({ lieu }: { lieu: FichePro }) {
  const T = utiliserTextes(TEXTES_FICHE_PRO_PAR_LANGUE).lecture;
  return (
    <div className="grid gap-6">
      <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">
        <span aria-hidden="true">👀 </span>
        {lierPonctuation(T.note)}
      </p>
      <section aria-labelledby="fiche-presentation" className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
        <h2 id="fiche-presentation" className="text-xl font-extrabold">{T.titre}</h2>
        <dl className="mt-3 grid gap-3">
          <div><dt className="text-sm font-semibold text-gris">{T.adresse}</dt><dd>{lieu.adresse || T.adresseVide}</dd></div>
          <div><dt className="text-sm font-semibold text-gris">{T.horaires}</dt><dd>{lieu.horaires || T.horairesVides}</dd></div>
          <div><dt className="text-sm font-semibold text-gris">{T.presentation}</dt><dd className="whitespace-pre-line">{lieu.texte || T.presentationVide}</dd></div>
        </dl>
      </section>
      <BlocInfosPratiques infos={lieu} />
    </div>
  );
}
