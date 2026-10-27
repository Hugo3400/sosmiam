import { POINTS_AMBASSADEUR } from "../../../../../packages/commun/src/regles/ambassadeurs.ts";
import { TitreSection } from "~/composants/interface/TitreSection";
import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_AMBASSADEURS_PAR_LANGUE } from "~/contenus/ambassadeurs";
import { TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE } from "~/contenus/programme-ambassadeur";
import { listerPaliersAmbassadeurs } from "~/fonctions/ambassadeurs/lister-paliers-ambassadeurs";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const CLES_BAREME = Object.keys(POINTS_AMBASSADEUR) as (keyof typeof POINTS_AMBASSADEUR)[];

/** Les 4 niveaux (badges du kit de marque), le barème des points, et le rappel que l'app n'est pas encore sortie. */
export function NiveauxProgramme() {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).niveaux;
  const paliers = listerPaliersAmbassadeurs(utiliserTextes(TEXTES_AMBASSADEURS_PAR_LANGUE));
  return (
    <Section id="niveaux" fond="jaune">
      <TitreSection chapo={T.chapo}>{T.titre}</TitreSection>
      <ol className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {paliers.map((palier, i) => (
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
        <h3 className="mb-5 text-2xl font-extrabold">{T.titreBareme}</h3>
        <ul className="grid gap-3">
          {CLES_BAREME.map((cle) => (
            <li key={T.bareme[cle]} className="flex items-start justify-between gap-4 border-b border-ligne pb-3 last:border-0 last:pb-0">
              <span>{lierPonctuation(T.bareme[cle])}</span>
              <strong className="shrink-0 rounded-full border-2 border-encre bg-jaune px-3 py-0.5 font-titre font-extrabold">
                +{POINTS_AMBASSADEUR[cle]}<span className="sr-only">{T.unitePoints(POINTS_AMBASSADEUR[cle])}</span>
              </strong>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-gris">{T.defis}</p>
      </div>

      <p className="mt-6 flex gap-3 rounded-carte border-2 border-dashed border-encre bg-white/70 px-5 py-4">
        <span aria-hidden="true" className="text-2xl leading-none">📱</span>
        <span>{lierPonctuation(T.noteApp)}</span>
      </p>
    </Section>
  );
}
