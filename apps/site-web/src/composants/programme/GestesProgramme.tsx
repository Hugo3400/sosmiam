import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { gestesAmbassadeur } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** « C'est quoi, un ambassadeur ? » : les quatre gestes, une carte chacun. */
export function GestesProgramme() {
  return (
    <Section id="c-est-quoi">
      <TitreSection chapo={lierPonctuation("Quelqu'un qui aime les bonnes petites adresses et qui aide SOS Miam à les faire découvrir. Concrètement, tu peux :")}>
        {lierPonctuation("C'est quoi, un ambassadeur ?")}
      </TitreSection>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {gestesAmbassadeur.map((geste) => (
          <li key={geste.titre} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut-jaune">
            <span aria-hidden="true" className="mb-3 block text-4xl leading-none">{geste.emoji}</span>
            <h3 className="mb-2 text-xl font-extrabold">{geste.titre}</h3>
            <p className="text-gris">{lierPonctuation(geste.texte)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
