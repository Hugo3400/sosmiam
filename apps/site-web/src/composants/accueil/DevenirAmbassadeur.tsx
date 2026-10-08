import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { ListeCoches } from "~/composants/interface/ListeCoches";
import { TitreSection } from "~/composants/interface/TitreSection";
import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { avantagesAmbassadeurs, missionsAmbassadeurs, paliersAmbassadeurs } from "~/contenus/ambassadeurs";

const blocs = [
  { titre: "Ce que tu fais", elements: missionsAmbassadeurs },
  { titre: "Ce que tu y gagnes", elements: avantagesAmbassadeurs },
];

/** Le programme Ambassadeurs : les paliers, les missions, les avantages, et l'appel aux fondateurs. */
export function DevenirAmbassadeur() {
  return (
    <Section id="ambassadeurs" fond="jaune">
      <div className="text-center">
        <Badge variante="blanc" className="mb-5">🎖️ Programme Ambassadeurs</Badge>
      </div>
      <TitreSection chapo="Tu connais les pépites du coin avant tout le monde ? Fais-les découvrir, et monte en grade à chaque lieu déniché.">
        Deviens la voix de ton quartier
      </TitreSection>

      <ol className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {paliersAmbassadeurs.map((palier, i) => (
          <li key={palier.titre}
            className={`rounded-carte border-2 border-encre px-5 py-6 shadow-brut ${palier.sombre ? "bg-encre text-jaune" : "bg-white"}`}>
            <BadgePalier niveau={(i + 1) as NiveauPalier} className="mb-3 h-16 w-16" />
            <h3 className="mb-1.5 text-xl font-extrabold">{palier.titre}</h3>
            <p className={`text-[.92rem] ${palier.sombre ? "text-jaune-clair" : "text-gris"}`}>{palier.texte}</p>
          </li>
        ))}
      </ol>

      <div className="grid gap-6 md:grid-cols-2">
        {blocs.map((bloc) => (
          <div key={bloc.titre} className="rounded-carte border-2 border-encre bg-creme p-7 md:p-8">
            <h3 className="mb-5 text-2xl font-extrabold">{bloc.titre}</h3>
            <ListeCoches elements={bloc.elements} sombre />
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-center">
        <Ecusson ruban="FONDATEUR" className="h-24 w-24 -rotate-6" />
        <p className="text-lg"><strong>On lance avec 10 ambassadeurs fondateurs</strong> à Montpellier.</p>
        <Bouton href="#inscription" variante="encre">Je veux en être</Bouton>
      </div>
    </Section>
  );
}
