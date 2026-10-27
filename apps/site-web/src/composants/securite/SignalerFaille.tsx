import { TexteRiche } from "~/composants/interface/TexteRiche";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { FormulaireSignalement } from "~/composants/securite/FormulaireSignalement";
import type { TextesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function SignalerFaille({ textes }: { textes: TextesSecurite["signaler"] }) {
  const { titre, chapo, aideTitre, aides, captures } = textes;
  return (
    <Section id="signaler" fond="creme" etroit>
      <TitreSection aGauche id="signaler-titre" chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <div className="mb-8 rounded-carte border-2 border-encre bg-jaune-clair p-6">
        <h3 className="font-titre text-xl font-extrabold"><span aria-hidden="true">🧾 </span>{aideTitre}</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {aides.map((aide) => (
            <li key={aide} className="flex gap-2"><span aria-hidden="true" className="font-bold">✓</span><span><TexteRiche texte={aide} /></span></li>
          ))}
        </ul>
        <p className="mt-4"><TexteRiche texte={captures} /></p>
      </div>
      <FormulaireSignalement />
    </Section>
  );
}
