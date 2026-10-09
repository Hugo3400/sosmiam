import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { RechercheCommune } from "~/composants/fondateurs/RechercheCommune";
import { TableauPlaces } from "~/composants/fondateurs/TableauPlaces";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Ecusson } from "~/composants/marque/Ecusson";
import { Section } from "~/composants/mise-en-page/Section";
import { cadeauxFondateurs, rencontreFondateurs, totalPlacesFondateurs } from "~/contenus/programme-ambassadeur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { CommuneFondateurs, ZoneFondateurs } from "~/types/compte";

/** Ce que la recherche « Ta ville » a trouvé (routes/ambassadeur/programme.tsx, d'après l'adresse ?ville=… ou ?commune=…). */
export type RechercheProgramme = {
  /** Ce qui est écrit dans le champ */
  saisie: string;
  resultat:
    | { etat: "zone"; commune: CommuneFondateurs; zone: ZoneFondateurs }
    | { etat: "choix"; communes: CommuneFondateurs[] }
    | { etat: "message"; message: string }
    | { etat: "vide" };
};

/** Les fondateurs de chaque ville : les places selon sa taille, ce qu'ils reçoivent, et les places de ta ville. */
export function FondateursProgramme({ recherche }: { recherche: RechercheProgramme }) {
  const { saisie, resultat } = recherche;
  return (
    <Section id="fondateurs" fond="encre">
      <div className="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <Ecusson ruban="FONDATEUR" className="mx-auto w-44 -rotate-6 sm:w-56 lg:w-72" />
        <div className="min-w-0">
          <TitreSection
            aGauche
            clair
            chapo={lierPonctuation(`Dans chaque ville, des ambassadeurs lancent l'aventure avec nous : ${totalPlacesFondateurs} places partout en France, selon la taille de ta ville. Une fois ton compte validé, tu candidates depuis ton espace pour ta ville (ou ton département), tant qu'il y reste des places.`)}
          >
            Les fondateurs de ta ville
          </TitreSection>
          <TableauPlaces clair />
        </div>
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <div className="min-w-0">
          <h3 className="mb-4 text-xl font-extrabold text-jaune">{lierPonctuation("Si tu es choisi, tu reçois :")}</h3>
          <ul className="grid gap-3.5">
            {cadeauxFondateurs.map((cadeau) => (
              <li key={cadeau.texte} className="flex items-start gap-3">
                <span aria-hidden="true" className="text-2xl leading-none">{cadeau.emoji}</span>
                <span>{lierPonctuation(cadeau.texte)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 flex gap-3 rounded-carte border-2 border-dashed border-creme/30 px-5 py-4 text-creme/85">
            <span aria-hidden="true" className="text-2xl leading-none">🎥</span>
            <span>{lierPonctuation(rencontreFondateurs)}</span>
          </p>
        </div>

        <div id="ta-ville" tabIndex={-1} className="min-w-0 scroll-mt-24 focus:outline-none">
          <h3 className="mb-2 text-xl font-extrabold text-jaune">Et dans ta ville ?</h3>
          <p className="mb-5 text-creme/85">{lierPonctuation("Tape le nom de ta commune ou ton code postal : on te dit combien il reste de places.")}</p>
          <RechercheCommune
            id="programme-ville"
            page="/programme"
            ancre="ta-ville"
            nomChamp="ville"
            libelle="Ta ville"
            valeurInitiale={resultat.etat === "zone" ? resultat.commune.nom : saisie}
            choix={resultat.etat === "choix" ? resultat.communes : null}
            message={resultat.etat === "message" ? resultat.message : null}
            bouton="Voir les places"
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
