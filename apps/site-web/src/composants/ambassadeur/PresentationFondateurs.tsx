import { Ecusson } from "~/composants/marque/Ecusson";
import { cadeauxFondateurs, rencontreFondateurs } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Ce que sont les fondateurs de chaque ville et ce qu'ils reçoivent, avant le formulaire de candidature. Seulement ce qui
 * est décidé (docs/decisions.md, « Fondateurs par ville ») : les textes viennent de contenus/programme-ambassadeur.ts.
 */
export function PresentationFondateurs() {
  return (
    <section aria-labelledby="fondateurs-titre" className="rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-10">
      <div className="flex flex-wrap items-center gap-5">
        <Ecusson ruban="FONDATEUR" className="h-24 w-24 shrink-0 -rotate-6" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="fondateurs-titre" className="text-2xl font-extrabold">Les fondateurs de ta ville</h2>
          <p className="mt-1.5">
            {lierPonctuation("Ce sont les premiers ambassadeurs de chaque ville : ils dénichent les premières pépites et lancent SOS Miam avec nous, partout en France.")}
          </p>
        </div>
      </div>
      <h3 className="mt-7 mb-4 text-xl font-extrabold">Ce qu'ils reçoivent</h3>
      <ul className="grid gap-3.5">
        {cadeauxFondateurs.map((cadeau) => (
          <li key={cadeau.texte} className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl leading-none">{cadeau.emoji}</span>
            <span>{lierPonctuation(cadeau.texte)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex gap-3 rounded-2xl border-2 border-dashed border-encre/40 px-4 py-3">
        <span aria-hidden="true" className="text-2xl leading-none">🎥</span>
        <span>{lierPonctuation(rencontreFondateurs)}</span>
      </p>
      <p className="mt-6">
        {lierPonctuation("C'est un programme de passionnés : pas de rémunération, ni horaires ni objectifs. Pas retenu ? Tu restes ambassadeur, tu grimpes les niveaux comme tout le monde, et tu peux recandidater quand tu veux.")}
      </p>
    </section>
  );
}
