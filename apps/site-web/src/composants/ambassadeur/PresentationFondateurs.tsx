import { Ecusson } from "~/composants/marque/Ecusson";
import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { EMOJIS_CADEAUX_FONDATEURS, TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Ce que sont les fondateurs de chaque ville et ce qu'ils reçoivent, avant le formulaire de candidature. Seulement ce qui
 * est décidé (docs/decisions.md, « Fondateurs par ville ») : les textes viennent de contenus/programme-ambassadeur.ts.
 */
export function PresentationFondateurs() {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE).presentation;
  const programme = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).fondateurs;
  return (
    <section aria-labelledby="fondateurs-titre" className="rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-10">
      <div className="flex flex-wrap items-center gap-5">
        <Ecusson ruban={programme.ruban} className="h-24 w-24 shrink-0 -rotate-6" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="fondateurs-titre" className="text-2xl font-extrabold">{T.titre}</h2>
          <p className="mt-1.5">
            {lierPonctuation(T.texte)}
          </p>
        </div>
      </div>
      <h3 className="mt-7 mb-4 text-xl font-extrabold">{T.recoivent}</h3>
      <ul className="grid gap-3.5">
        {programme.cadeaux.map((cadeau, i) => (
          <li key={cadeau} className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl leading-none">{EMOJIS_CADEAUX_FONDATEURS[i]}</span>
            <span>{lierPonctuation(cadeau)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex gap-3 rounded-2xl border-2 border-dashed border-encre/40 px-4 py-3">
        <span aria-hidden="true" className="text-2xl leading-none">🎥</span>
        <span>{lierPonctuation(programme.rencontre)}</span>
      </p>
      <p className="mt-6">
        {lierPonctuation(T.conclusion)}
      </p>
    </section>
  );
}
