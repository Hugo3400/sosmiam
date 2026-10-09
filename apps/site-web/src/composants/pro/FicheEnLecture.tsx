import { BlocInfosPratiques } from "~/composants/lieux/BlocInfosPratiques";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePro } from "~/types/pro";

/** La fiche vue par un membre de l'équipe : tout se lit, seul le gérant modifie. */
export function FicheEnLecture({ lieu }: { lieu: FichePro }) {
  return (
    <div className="grid gap-6">
      <p role="note" className="rounded-2xl border-2 border-dashed border-encre bg-white px-5 py-4 font-semibold">
        <span aria-hidden="true">👀 </span>
        {lierPonctuation("Tu fais partie de l'équipe : tu vois la fiche, et seul le gérant la modifie. Une erreur ? Dis-le-lui !")}
      </p>
      <section aria-labelledby="fiche-presentation" className="rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6">
        <h2 id="fiche-presentation" className="text-xl font-extrabold">Horaires et présentation</h2>
        <dl className="mt-3 grid gap-3">
          <div><dt className="text-sm font-semibold text-gris">Adresse</dt><dd>{lieu.adresse || "Pas encore indiquée"}</dd></div>
          <div><dt className="text-sm font-semibold text-gris">Horaires</dt><dd>{lieu.horaires || "Pas encore indiqués"}</dd></div>
          <div><dt className="text-sm font-semibold text-gris">Présentation</dt><dd className="whitespace-pre-line">{lieu.texte || "Pas encore écrite"}</dd></div>
        </dl>
      </section>
      <BlocInfosPratiques infos={lieu} />
    </div>
  );
}
