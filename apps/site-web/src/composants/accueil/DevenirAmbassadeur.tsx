import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { ListeCoches } from "~/composants/interface/ListeCoches";
import { TitreSection } from "~/composants/interface/TitreSection";
import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { adresseEspaceAmbassadeur, avantagesAmbassadeurs, missionsAmbassadeurs, paliersAmbassadeurs } from "~/contenus/ambassadeurs";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const blocs = [
  { titre: "Ce que tu fais", elements: missionsAmbassadeurs },
  { titre: "Ce que tu y gagnes", elements: avantagesAmbassadeurs },
];

/**
 * Le programme Ambassadeurs : les paliers, les missions, les avantages, l'appel aux fondateurs, et le bouton vers l'espace
 * ambassadeur (https://ambassadeur.sosmiam.fr, dès 18 ans), où tout est expliqué en détail.
 */
export function DevenirAmbassadeur() {
  return (
    <Section id="ambassadeurs" fond="jaune">
      <div className="text-center">
        <Badge variante="blanc" className="mb-5">🎖️ Programme Ambassadeurs</Badge>
      </div>
      {/* Pas « un grade à chaque lieu » : un lieu accepté rapporte 30 points, et les paliers sont à 100 et 300 points */}
      <TitreSection chapo={lierPonctuation("Tu connais les pépites du coin avant tout le monde ? Fais-les découvrir : chaque lieu déniché te rapporte des points pour monter en grade.")}>
        Deviens la voix de ton quartier
      </TitreSection>

      <ol className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {paliersAmbassadeurs.map((palier, i) => (
          <li key={palier.titre}
            className={`rounded-carte border-2 border-encre px-5 py-6 shadow-brut ${palier.sombre ? "bg-encre text-jaune" : "bg-white"}`}>
            <BadgePalier niveau={(i + 1) as NiveauPalier} className="mb-3 h-16 w-16" />
            <h3 className="mb-1 text-xl font-extrabold">{palier.titre}</h3>
            <p className="mb-1.5 font-titre font-extrabold">{palier.seuil}</p>
            <p className={`text-[.92rem] ${palier.sombre ? "text-jaune-clair" : "text-gris"}`}>{lierPonctuation(palier.texte)}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 md:grid-cols-2">
        {blocs.map((bloc) => (
          <div key={bloc.titre} className="rounded-carte border-2 border-encre bg-creme p-7 md:p-8">
            <h3 className="mb-5 text-2xl font-extrabold">{bloc.titre}</h3>
            <ListeCoches
              elements={bloc.elements.map((element) => ({ fort: lierPonctuation(element.fort), suite: lierPonctuation(element.suite) }))}
              sombre
            />
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-center">
        <Ecusson ruban="FONDATEUR" className="h-24 w-24 -rotate-6" />
        <p className="text-lg"><strong>Des fondateurs dans chaque ville</strong>{lierPonctuation(" : 367 places, partout en France.")}</p>
        <Bouton href={adresseEspaceAmbassadeur} variante="encre">Je deviens ambassadeur</Bouton>
      </div>
      <p className="mt-5 text-center text-[.95rem]">
        {lierPonctuation("Dès 18 ans, sur ambassadeur.sosmiam.fr : crée ton compte, l'équipe le valide, et tu pourras candidater pour être fondateur de ta ville (ou de ton département), tant qu'il y reste des places.")}
      </p>
    </Section>
  );
}
