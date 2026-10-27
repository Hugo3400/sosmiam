import { TexteRiche } from "~/composants/interface/TexteRiche";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import type { TextesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function ReglesSecurite({ textes }: { textes: TextesSecurite["regles"] }) {
  const { titre, chapo, regles, neCompteTitre, neCompteChapo, neCompte } = textes;
  return (
    <Section id="regles" fond="creme">
      <TitreSection aGauche chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <ol className="grid gap-4 md:grid-cols-2">
        {regles.map((regle, rang) => (
          <li key={regle} className="flex gap-4 rounded-carte border-2 border-encre bg-white p-5 shadow-brut">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-encre bg-jaune font-titre font-extrabold">{rang + 1}</span>
            <p><TexteRiche texte={regle} /></p>
          </li>
        ))}
      </ol>
      <div id="ne-compte-pas" className="mt-12 rounded-carte border-2 border-dashed border-encre bg-white p-6 md:p-8">
        <h3 className="text-2xl font-extrabold"><span aria-hidden="true">🙅 </span>{neCompteTitre}</h3>
        <p className="mt-2 text-gris">{lierPonctuation(neCompteChapo)}</p>
        <ul className="mt-4 grid gap-2 md:grid-cols-2">
          {neCompte.map((cas) => (
            <li key={cas} className="flex gap-2"><span aria-hidden="true" className="font-bold">✗</span><span>{lierPonctuation(cas)}</span></li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
