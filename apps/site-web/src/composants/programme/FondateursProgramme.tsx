import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { RechercheCommune } from "~/composants/fondateurs/RechercheCommune";
import { TableauPlaces } from "~/composants/fondateurs/TableauPlaces";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { EMOJIS_CADEAUX_FONDATEURS, TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE, TOTAL_PLACES_FONDATEURS } from "~/contenus/programme-ambassadeur";
import { TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE } from "~/contenus/recherche-commune";
import { ecrireMessageRecherche } from "~/fonctions/fondateurs/ecrire-message-recherche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { ResultatRecherche } from "~/types/compte";

/** Ce que la recherche « Ta ville » a trouvé (routes/ambassadeur/programme.tsx, d'après l'adresse ?ville=… ou ?commune=…). */
export type RechercheProgramme = {
  /** Ce qui est écrit dans le champ */
  saisie: string;
  resultat: ResultatRecherche;
};

/** Les fondateurs de chaque ville : les places selon sa taille, ce qu'ils reçoivent, et les places de ta ville. */
export function FondateursProgramme({ recherche }: { recherche: RechercheProgramme }) {
  const T = utiliserTextes(TEXTES_PROGRAMME_AMBASSADEUR_PAR_LANGUE).fondateurs;
  const textesRecherche = utiliserTextes(TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const { saisie, resultat } = recherche;
  return (
    <Section id="fondateurs" fond="encre">
      <div className="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <Ecusson ruban={T.ruban} className="mx-auto w-44 -rotate-6 sm:w-56 lg:w-72" />
        <div className="min-w-0">
          <TitreSection
            aGauche
            clair
            chapo={lierPonctuation(T.chapo(TOTAL_PLACES_FONDATEURS))}
          >
            {T.titre}
          </TitreSection>
          <TableauPlaces clair />
        </div>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-4 text-xl font-extrabold text-jaune">{lierPonctuation(T.titreCadeaux)}</h3>
          <ul className="grid gap-3.5">
            {T.cadeaux.map((cadeau, i) => (
              <li key={cadeau} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{EMOJIS_CADEAUX_FONDATEURS[i]}</span>
                <span>{lierPonctuation(cadeau)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex gap-3 rounded-carte border-2 border-dashed border-creme/30 px-5 py-4 text-creme/85">
            <span aria-hidden="true" className="text-2xl leading-none">🎥</span>
            <span>{lierPonctuation(T.rencontre)}</span>
          </p>
        </div>

        <div id="ta-ville" tabIndex={-1} className="min-w-0 scroll-mt-24 focus:outline-none">
          <h3 className="mb-2 text-xl font-extrabold text-jaune">{T.titreVille}</h3>
          <p className="mb-5 text-creme/85">{lierPonctuation(T.texteVille)}</p>
          <RechercheCommune
            id="programme-ville"
            page={lien("/programme")}
            ancre="ta-ville"
            nomChamp="ville"
            libelle={T.libelleVille}
            valeurInitiale={resultat.etat === "zone" ? resultat.commune.nom : saisie}
            choix={resultat.etat === "choix" ? resultat.communes : null}
            message={resultat.etat === "message" ? ecrireMessageRecherche(resultat, textesRecherche) : null}
            bouton={T.boutonVille}
            clair
          />
          {/* Annoncé aux lecteurs d'écran quand une commune est choisie dans les suggestions (sans rechargement) */}
          <div role="status" className="mt-5">
            {resultat.etat === "zone" && <PlacesZone commune={resultat.commune} zone={resultat.zone} clair />}
          </div>
        </div>
      </div>
    </Section>
  );
}
