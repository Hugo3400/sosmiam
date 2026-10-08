import { Question } from "~/composants/faq/Question";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { questionsProgramme } from "~/contenus/programme-ambassadeur";

/** Les questions qu'on se pose avant de se lancer, qui se déplient au clic (même forme que la FAQ du site). */
export function QuestionsProgramme() {
  return (
    <Section id="questions" fond="creme" etroit>
      <TitreSection chapo="Tu te poses sûrement une de ces questions.">Tes questions</TitreSection>
      {questionsProgramme.map((question) => <Question key={question.id} question={question} />)}
    </Section>
  );
}
