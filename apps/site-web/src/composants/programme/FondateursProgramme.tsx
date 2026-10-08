import { TitreSection } from "~/composants/interface/TitreSection";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { cadeauxFondateurs } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Les 10 ambassadeurs fondateurs : ce qu'ils reçoivent, et comment on fait connaissance. */
export function FondateursProgramme() {
  return (
    <Section id="fondateurs" fond="encre">
      <div className="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <Ecusson ruban="FONDATEUR" className="mx-auto w-44 -rotate-6 sm:w-56 lg:w-72" />
        <div>
          <TitreSection
            aGauche
            clair
            chapo={lierPonctuation("On cherche 10 ambassadeurs pour lancer l'aventure avec nous. Une fois ton compte validé, tu peux candidater depuis ton espace.")}
          >
            Les 10 fondateurs
          </TitreSection>
          <h3 className="mb-4 text-xl font-extrabold text-jaune">{lierPonctuation("Si tu es choisi, tu reçois :")}</h3>
          <ul className="grid gap-3.5">
            {cadeauxFondateurs.map((cadeau) => (
              <li key={cadeau.texte} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{cadeau.emoji}</span>
                <span>{lierPonctuation(cadeau.texte)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex gap-3 rounded-carte border-2 border-dashed border-creme/30 px-5 py-4 text-creme/85">
            <span aria-hidden="true" className="text-2xl leading-none">☕</span>
            <span>{lierPonctuation("Pour faire connaissance : 20 minutes, autour d'un café ou en visio.")}</span>
          </p>
        </div>
      </div>
    </Section>
  );
}
