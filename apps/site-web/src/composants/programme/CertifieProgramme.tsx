import { TitreSection } from "~/composants/interface/TitreSection";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { certifieProgramme } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Ambassadeur certifié, en court : qui, comment on le devient, ce qu'on a de plus, et la règle (jamais payé par un lieu).
 * Textes : contenus/programme-ambassadeur.ts (aussi en haut de /espace/certification).
 */
export function CertifieProgramme() {
  const { titre, chapo, qui, devenir, avantages, regle } = certifieProgramme;
  return (
    <Section id="ambassadeur-certifie">
      <TitreSection chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-5 rounded-carte border-2 border-encre bg-jaune p-6 shadow-brut md:p-8">
          <Ecusson ruban="CERTIFIÉ" className="h-24 w-24 -rotate-6" />
          <div>
            <h3 className="text-xl font-extrabold">{lierPonctuation("C'est qui ?")}</h3>
            <p className="mt-1.5">{lierPonctuation(qui)}</p>
          </div>
          <div>
            <h3 className="text-xl font-extrabold">{lierPonctuation("Comment on le devient ?")}</h3>
            <p className="mt-1.5">{lierPonctuation(devenir)}</p>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="mb-4 text-xl font-extrabold">Ce que tu as de plus</h3>
          <ul className="grid gap-3.5">
            {avantages.map((avantage) => (
              <li key={avantage.texte} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{avantage.emoji}</span>
                <span>{lierPonctuation(avantage.texte)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex gap-3 rounded-carte border-2 border-dashed border-encre/40 px-5 py-4">
            <span aria-hidden="true" className="text-2xl leading-none">🤝</span>
            <span><strong>{lierPonctuation("La règle d'or : ")}</strong>{lierPonctuation(regle)}</span>
          </p>
        </div>
      </div>
    </Section>
  );
}
