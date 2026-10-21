import { TexteRiche } from "~/composants/interface/TexteRiche";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { perimetreSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function PerimetreSecurite() {
  const { titre, chapo, dansLeJeu, deuxComptes, horsJeuTitre, horsJeu } = perimetreSecurite;
  return (
    <Section id="perimetre">
      <TitreSection aGauche chapo={lierPonctuation(chapo)}>{titre}</TitreSection>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-carte border-2 border-encre bg-creme p-6 shadow-brut md:p-8">
          <h3 className="text-2xl font-extrabold"><span aria-hidden="true">🎯 </span>Dans le jeu</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {dansLeJeu.map((cible) => (
              <li key={cible.nom} className="flex gap-2">
                <span aria-hidden="true" className="font-bold">✓</span>
                <span><strong className="break-all">{cible.nom}</strong>{lierPonctuation(` : ${cible.texte}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 rounded-2xl border-2 border-encre bg-white px-4 py-3"><TexteRiche texte={deuxComptes} /></p>
        </div>
        <div className="rounded-carte border-2 border-dashed border-encre bg-white p-6 md:p-8">
          <h3 className="text-2xl font-extrabold"><span aria-hidden="true">🚫 </span>{horsJeuTitre}</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {horsJeu.map((texte) => (
              <li key={texte} className="flex gap-2">
                <span aria-hidden="true" className="font-bold">✗</span>
                <span>{lierPonctuation(texte)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
