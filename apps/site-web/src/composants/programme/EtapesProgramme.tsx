import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Comment ça marche : le compte (dès 18 ans), la validation par l'équipe, puis l'espace. */
export function EtapesProgramme() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).etapes;
  return (
    <Section id="comment-ca-marche">
      <TitreSection chapo={T.chapo}>{T.titre}</TitreSection>
      <ol className="grid gap-6 md:grid-cols-3">
        {T.liste.map((etape, i) => (
          <li key={etape.titre} className="rounded-carte border-2 border-encre bg-white p-8 shadow-brut-jaune">
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-jaune font-titre text-2xl font-extrabold">{i + 1}</span>
            <h3 className="mb-2 text-2xl font-extrabold">{etape.titre}</h3>
            <p className="text-gris">{lierPonctuation(etape.texte)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
