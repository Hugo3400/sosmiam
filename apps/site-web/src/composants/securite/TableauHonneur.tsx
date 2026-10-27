import { ecrireMoisLangue } from "../../../../../packages/commun/src/fonctions/langue/ecrire-mois-langue.ts";
import type { Langue } from "../../../../../packages/commun/src/regles/langues.ts";
import type { EntreeTableauHonneur } from "../../../../../packages/commun/src/types/securite.ts";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { ANCRE_TABLEAU_HONNEUR, type TextesSecurite } from "~/contenus/securite";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";

function ecrireMois(mois: string, langue: Langue): string {
  const morceaux = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mois);
  return morceaux ? ecrireMoisLangue({ annee: Number(morceaux[1]), mois: Number(morceaux[2]) }, langue) : mois;
}

export function TableauHonneur({ entrees, textes }: { entrees: EntreeTableauHonneur[] | null; textes: TextesSecurite["tableauHonneur"] }) {
  const langue = utiliserLangue();
  const { titre, chapo, videTitre, videTexte, indisponible } = textes;
  return (
    <Section id={ANCRE_TABLEAU_HONNEUR}>
      <TitreSection aGauche chapo={lierPonctuation(chapo)}>{titre}<span aria-hidden="true"> 🏆</span></TitreSection>
      {entrees === null && <p className="rounded-carte border-2 border-dashed border-encre bg-creme px-6 py-5 text-gris">{lierPonctuation(indisponible)}</p>}
      {entrees !== null && entrees.length === 0 && (
        <div className="flex flex-col items-center rounded-carte border-2 border-dashed border-encre bg-creme px-6 py-10 text-center">
          <Mascotte expression="clin" className="h-24 w-24" />
          <h3 className="mt-4 text-2xl font-extrabold">{lierPonctuation(videTitre)}</h3>
          <p className="mt-2 max-w-md text-gris">{lierPonctuation(videTexte)}</p>
        </div>
      )}
      {entrees !== null && entrees.length > 0 && (
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entrees.map((entree, rang) => (
            <li key={`${entree.nom}-${entree.mois}-${rang}`} className="flex items-center gap-3 rounded-2xl border-2 border-encre bg-creme px-4 py-3 shadow-brut">
              <span aria-hidden="true" className="text-2xl">🐞</span>
              <span className="min-w-0">
                <strong className="block break-words font-titre text-lg">{entree.nom}</strong>
                <span className="text-sm text-gris">{ecrireMois(entree.mois, langue)}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
