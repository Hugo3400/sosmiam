import { Badge } from "~/composants/interface/Badge";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_BIG_SOS_EN_BREF_PAR_LANGUE } from "~/contenus/big-sos-en-bref";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const ICONES_PAGE = ["📖", "🎬", "📈", "🎟️"];

/** Le BIG SOS expliqué sur l'accueil : le parcours d'une demande et ce qu'on trouve sur la page du lieu. */
export function BigSosEnBref() {
  const T = utiliserTextes(TEXTES_BIG_SOS_EN_BREF_PAR_LANGUE);
  return (
    <Section id="big-sos" fond="encre">
      <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Badge variante="alerte" className="mb-5">🆘 BIG SOS</Badge>
          <TitreSection aGauche clair chapo={lierPonctuation(T.chapo)}>
            {T.titre}
          </TitreSection>

          <ol className="grid gap-5">
            {T.etapes.map((etape, i) => (
              <li key={etape.titre} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-jaune font-titre text-lg font-extrabold text-encre">{i + 1}</span>
                <div>
                  <h3 className="text-xl font-extrabold">{etape.titre}</h3>
                  <p className="text-creme/75">{lierPonctuation(etape.texte)}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-creme/75 sm:pl-14">
            <strong className="text-creme">{T.apres.question}</strong> {T.apres.texte}
          </p>
        </div>

        <div className="rounded-carte border-2 border-encre bg-creme p-6 text-encre shadow-brut-jaune md:p-8">
          <p className="font-titre text-sm font-extrabold tracking-wide text-rouge-texte uppercase">{T.surSaPage}</p>
          <ul className="mt-4 grid gap-3.5">
            {T.page.map((texte, i) => (
              <li key={texte} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{ICONES_PAGE[i]}</span>
                <span>{texte}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="mt-12 rounded-carte border-2 border-dashed border-creme/30 px-5 py-4 text-center text-creme/85">{T.note}</p>
    </Section>
  );
}
