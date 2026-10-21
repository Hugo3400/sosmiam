import { TexteRiche } from "~/composants/interface/TexteRiche";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { recompensesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function RecompensesSecurite() {
  const { titre, chapo, recompenses, prime, premier } = recompensesSecurite;
  return (
    <Section id="recompenses" fond="creme">
      <TitreSection aGauche chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <ul className="grid gap-5 md:grid-cols-3">
        {recompenses.map((recompense) => (
          <li key={recompense.emoji} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
            <p aria-hidden="true" className="text-4xl">{recompense.emoji}</p>
            <p className="mt-3"><TexteRiche texte={recompense.texte} /></p>
          </li>
        ))}
      </ul>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <p className="rounded-carte border-2 border-dashed border-encre bg-white px-6 py-5"><span aria-hidden="true">💶 </span><TexteRiche texte={prime} /></p>
        <p className="rounded-carte border-2 border-dashed border-encre bg-white px-6 py-5"><span aria-hidden="true">⏱️ </span><TexteRiche texte={premier} /></p>
      </div>
    </Section>
  );
}
