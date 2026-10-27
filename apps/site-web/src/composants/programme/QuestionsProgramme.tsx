import { Question } from "~/composants/faq/Question";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Les questions qu'on se pose avant de se lancer, qui se déplient au clic (même forme que la FAQ du site). */
export function QuestionsProgramme() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).questions;
  return (
    <Section id="questions" fond="creme" etroit>
      <TitreSection chapo={T.chapo}>{T.titre}</TitreSection>
      {Object.entries(T.liste).map(([id, question]) => <Question key={id} question={{ id, ...question }} />)}
    </Section>
  );
}
