import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { gainsAmbassadeur } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Ce que tu y gagnes : badges, « Déniché par toi » et points. Rien de plus (pas de rémunération). */
export function GainsProgramme() {
  return (
    <Section id="ce-que-tu-y-gagnes" fond="creme">
      <TitreSection chapo={lierPonctuation("Pas d'argent : c'est une aventure de passionnés. Mais il y a quand même de quoi être fier :")}>
        Ce que tu y gagnes
      </TitreSection>
      <ul className="grid gap-5 md:grid-cols-3">
        {gainsAmbassadeur.map((gain) => (
          <li key={gain.titre} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut">
            <span aria-hidden="true" className="mb-3 block text-4xl leading-none">{gain.emoji}</span>
            <h3 className="mb-2 text-xl font-extrabold">{lierPonctuation(gain.titre)}</h3>
            <p className="text-gris">{lierPonctuation(gain.texte)}</p>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-center text-lg">
        {"Et si tu deviens l'un des "}
        <a href="#fondateurs" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
          fondateurs de ta ville
        </a>
        , il y a encore plus.
      </p>
    </Section>
  );
}
