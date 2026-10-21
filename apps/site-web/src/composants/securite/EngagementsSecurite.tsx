import { TexteRiche } from "~/composants/interface/TexteRiche";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { engagementsSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function EngagementsSecurite() {
  const { titre, chapo, engagements, promesse } = engagementsSecurite;
  return (
    <Section id="engagements">
      <TitreSection aGauche chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <ul className="grid gap-4 md:grid-cols-2">
        {engagements.map((engagement) => (
          <li key={engagement} className="rounded-carte border-2 border-encre bg-creme p-6 text-lg shadow-brut"><TexteRiche texte={engagement} /></li>
        ))}
      </ul>
      <p className="mt-8 rounded-carte border-2 border-encre bg-jaune px-6 py-5 text-lg font-semibold shadow-brut-grand md:px-8">
        <span aria-hidden="true">🤝 </span>{lierPonctuation(promesse)}
      </p>
    </Section>
  );
}
