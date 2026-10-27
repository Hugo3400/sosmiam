import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { EMOJIS_GESTES_AMBASSADEUR, TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** « C'est quoi, un ambassadeur ? » : les quatre gestes, une carte chacun. */
export function GestesProgramme() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).gestes;
  return (
    <Section id="c-est-quoi">
      <TitreSection chapo={lierPonctuation(T.chapo)}>
        {lierPonctuation(T.titre)}
      </TitreSection>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {T.liste.map((geste, i) => (
          <li key={geste.titre} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut-jaune">
            <span aria-hidden="true" className="mb-3 block text-4xl leading-none">{EMOJIS_GESTES_AMBASSADEUR[i]}</span>
            <h3 className="mb-2 text-xl font-extrabold">{geste.titre}</h3>
            <p className="text-gris">{lierPonctuation(geste.texte)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
