import { Badge } from "~/composants/interface/Badge";
import { Bouton } from "~/composants/interface/Bouton";
import { ListeCoches } from "~/composants/interface/ListeCoches";
import { TitreSection } from "~/composants/interface/TitreSection";
import { BadgePalier, type NiveauPalier } from "~/composants/marque/BadgePalier";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { TEXTES_AMBASSADEURS_PAR_LANGUE } from "~/contenus/ambassadeurs";
import { TEXTES_DEVENIR_AMBASSADEUR_PAR_LANGUE } from "~/contenus/devenir-ambassadeur";
import { listerPaliersAmbassadeurs } from "~/fonctions/ambassadeurs/lister-paliers-ambassadeurs";
import { ecrireAdresseEspaceAmbassadeur } from "~/fonctions/hotes/ecrire-adresse-espace-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Le programme Ambassadeurs : les paliers, les missions, les avantages, l'appel aux fondateurs, et le bouton vers l'espace
 * ambassadeur (https://ambassadeur.sosmiam.fr, dès 18 ans), où tout est expliqué en détail.
 */
export function DevenirAmbassadeur() {
  const T = utiliserTextes(TEXTES_DEVENIR_AMBASSADEUR_PAR_LANGUE);
  const programme = utiliserTextes(TEXTES_AMBASSADEURS_PAR_LANGUE);
  const langue = utiliserLangue();
  const paliers = listerPaliersAmbassadeurs(programme);
  const blocs = [
    { titre: T.blocs.missions, elements: programme.missions },
    { titre: T.blocs.avantages, elements: programme.avantages },
  ];

  return (
    <Section id="ambassadeurs" fond="jaune">
      <div className="text-center">
        <Badge variante="blanc" className="mb-5">{T.badge}</Badge>
      </div>
      {/* Pas « un grade à chaque lieu » : un lieu accepté rapporte 30 points, et les paliers sont à 100 et 300 points */}
      <TitreSection chapo={lierPonctuation(T.chapo)}>
        {T.titre}
      </TitreSection>

      <ol className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {paliers.map((palier, i) => (
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
        <Ecusson ruban={T.ruban} className="h-24 w-24 -rotate-6" />
        <p className="text-lg"><strong>{T.fondateurs.fort}</strong>{lierPonctuation(T.fondateurs.suite)}</p>
        <Bouton href={ecrireAdresseEspaceAmbassadeur(langue)} variante="encre">{T.bouton}</Bouton>
      </div>
      <p className="mt-5 text-center text-[.95rem]">
        {lierPonctuation(T.conditions)}
      </p>
    </Section>
  );
}
