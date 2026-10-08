import { TitreSection } from "~/composants/interface/TitreSection";
import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { Section } from "~/composants/mise-en-page/Section";
import { paliersAmbassadeurs } from "~/contenus/ambassadeurs";
import { baremePoints, noteAppProgramme } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/** Les 4 niveaux (badges du kit de marque), le barème des points, et le rappel que l'app n'est pas encore sortie. */
export function NiveauxProgramme() {
  return (
    <Section id="niveaux" fond="jaune">
      <TitreSection chapo="Tout le monde commence Curieux. Ensuite, tes points te font monter.">Les 4 niveaux</TitreSection>
      <ol className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {paliersAmbassadeurs.map((palier, i) => (
          <li key={palier.titre}
            className={`rounded-carte border-2 border-encre px-5 py-6 shadow-brut ${palier.sombre ? "bg-encre text-jaune" : "bg-white"}`}>
            <BadgePalier niveau={(i + 1) as NiveauPalier} className="mb-3 h-20 w-20" />
            <h3 className="text-xl font-extrabold">{palier.titre}</h3>
            <p className="mt-1 font-titre text-lg font-extrabold">{palier.seuil}</p>
            <p className={`mt-1.5 text-[.95rem] ${palier.sombre ? "text-jaune-clair" : "text-gris"}`}>{lierPonctuation(palier.texte)}</p>
          </li>
        ))}
      </ol>

      <div className="rounded-carte border-2 border-encre bg-creme p-6 md:p-8">
        <h3 className="mb-5 text-2xl font-extrabold">Ce qui rapporte des points</h3>
        <ul className="grid gap-3">
          {baremePoints.map((ligne) => (
            <li key={ligne.action} className="flex items-start justify-between gap-4 border-b border-ligne pb-3 last:border-0 last:pb-0">
              <span>{lierPonctuation(ligne.action)}</span>
              <strong className="shrink-0 rounded-full border-2 border-encre bg-jaune px-3 py-0.5 font-titre font-extrabold">
                +{ligne.points}<span className="sr-only"> points</span>
              </strong>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-gris">Et chaque défi réussi rapporte ses propres points.</p>
      </div>

      <p className="mt-6 flex gap-3 rounded-carte border-2 border-dashed border-encre bg-white/70 px-5 py-4">
        <span aria-hidden="true" className="text-2xl leading-none">📱</span>
        <span>{lierPonctuation(noteAppProgramme)}</span>
      </p>
    </Section>
  );
}
