import { Ecusson } from "~/composants/marque/Ecusson";
import { TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE } from "~/contenus/ambassadeur-certifie";
import { EMOJIS_AVANTAGES_CERTIFIE, TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Ce qu'est un ambassadeur certifié, ce qu'il a de plus et sa règle, avant le formulaire de candidature. Seulement ce qui
 * est décidé (docs/decisions.md, « Ambassadeur certifié ») : les textes viennent de contenus/programme-ambassadeur.ts.
 */
export function PresentationCertification() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).certifie;
  const { ajout } = utiliserTextes(TEXTES_AMBASSADEUR_CERTIFIE_PAR_LANGUE);
  return (
    <section aria-labelledby="certifie-titre" className="rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-10">
      <div className="flex flex-wrap items-center gap-5">
        <Ecusson ruban={T.ruban} className="h-24 w-24 shrink-0 -rotate-6" />
        <div className="min-w-0 flex-1 basis-56">
          <h2 id="certifie-titre" className="text-2xl font-extrabold">{lierPonctuation(T.titreQui)}</h2>
          <p className="mt-1.5">{lierPonctuation(T.qui)}</p>
        </div>
      </div>
      <h3 className="mt-7 mb-4 text-xl font-extrabold">{T.titreAvantages}</h3>
      <ul className="grid gap-3.5">
        {T.avantages.map((avantage, i) => (
          <li key={avantage} className="flex items-start gap-3">
            <span aria-hidden="true" className="text-2xl leading-none">{EMOJIS_AVANTAGES_CERTIFIE[i]}</span>
            <span>{lierPonctuation(avantage)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-6 flex gap-3 rounded-2xl border-2 border-dashed border-encre/40 px-4 py-3">
        <span aria-hidden="true" className="text-2xl leading-none">🤝</span>
        <span><strong>{lierPonctuation(T.titreRegle)}</strong>{lierPonctuation(T.regle)}</span>
      </p>
      <p className="mt-6">
        {lierPonctuation(`${T.devenir} ${ajout}`)}
      </p>
    </section>
  );
}
