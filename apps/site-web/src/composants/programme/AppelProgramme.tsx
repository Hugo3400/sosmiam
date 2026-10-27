import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { BoutonsProgramme } from "~/composants/programme/BoutonsProgramme";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Bas de la page /programme : on se lance. */
export function AppelProgramme() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).appel;
  return (
    <Section fond="jaune">
      <TitreSection chapo={lierPonctuation(T.chapo)}>
        {lierPonctuation(T.titre)}
      </TitreSection>
      <BoutonsProgramme surJaune centre />
      <p className="mt-6 text-center text-sm font-semibold">{T.note}</p>
    </Section>
  );
}
