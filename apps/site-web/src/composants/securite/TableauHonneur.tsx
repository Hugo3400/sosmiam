import type { EntreeTableauHonneur } from "../../../../../packages/commun/src/types/securite.ts";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Mascotte } from "~/composants/marque/Mascotte";
import { Section } from "~/composants/mise-en-page/Section";
import { textesTableauHonneur } from "~/contenus/securite";
import { formaterMoisEnLettres } from "~/fonctions/dates/formater-mois-en-lettres";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function TableauHonneur({ entrees }: { entrees: EntreeTableauHonneur[] | null }) {
  const { ancre, titre, chapo, videTitre, videTexte, indisponible } = textesTableauHonneur;
  return (
    <Section id={ancre}>
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
                <span className="text-sm text-gris">{formaterMoisEnLettres(entree.mois) ?? entree.mois}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
