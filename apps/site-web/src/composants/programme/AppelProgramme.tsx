import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { BoutonsProgramme } from "~/composants/programme/BoutonsProgramme";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Bas de la page /programme : on se lance. */
export function AppelProgramme() {
  return (
    <Section fond="jaune">
      <TitreSection chapo={lierPonctuation("Crée ton compte : l'équipe le valide, puis ton espace s'ouvre.")}>
        {lierPonctuation("Prêt à faire briller ton coin ?")}
      </TitreSection>
      <BoutonsProgramme surJaune centre />
      <p className="mt-6 text-center text-sm font-semibold">Dès 18 ans · gratuit · ni horaires ni objectifs</p>
    </Section>
  );
}
