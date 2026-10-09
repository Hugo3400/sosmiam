import { Ecusson } from "~/composants/marque/Ecusson";
import { certifieProgramme } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Ce qu'est un ambassadeur certifié, ce qu'il a de plus et sa règle, avant le formulaire de candidature. Seulement ce qui
 * est décidé (docs/decisions.md, « Ambassadeur certifié ») : les textes viennent de contenus/programme-ambassadeur.ts.
 */
export function PresentationCertification() {
  const { qui, devenir, avantages, regle } = certifieProgramme;
  return (
    <section aria-labelledby="certifie-titre" className="rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-10">
      <div className="flex flex-wrap items-center gap-5">
        <Ecusson ruban="CERTIFIÉ" className="h-24 w-24 shrink-0 -rotate-6" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="certifie-titre" className="text-2xl font-extrabold">{lierPonctuation("C'est qui ?")}</h2>
          <p className="mt-1.5">{lierPonctuation(qui)}</p>
        </div>
      </div>
      <h3 className="mt-7 mb-4 text-xl font-extrabold">Ce que tu as de plus</h3>
      <ul className="grid gap-3.5">
        {avantages.map((avantage) => (
          <li key={avantage.texte} className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl leading-none">{avantage.emoji}</span>
            <span>{lierPonctuation(avantage.texte)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex gap-3 rounded-2xl border-2 border-dashed border-encre/40 px-4 py-3">
        <span aria-hidden="true" className="text-2xl leading-none">🤝</span>
        <span><strong>{lierPonctuation("La règle d'or : ")}</strong>{lierPonctuation(regle)}</span>
      </p>
      <p className="mt-6">
        {lierPonctuation(`${devenir} Ce titre s'ajoute à ton niveau (et à ton titre de fondateur si tu en as un) : c'est toujours un programme de passionnés, sans rémunération, ni horaires ni objectifs.`)}
      </p>
    </section>
  );
}
