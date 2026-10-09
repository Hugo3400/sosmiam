import { Link } from "react-router";

import { FondateursAuComplet } from "~/composants/ambassadeur/FondateursAuComplet";
import { FormulaireCandidature } from "~/composants/ambassadeur/FormulaireCandidature";
import { PresentationFondateurs } from "~/composants/ambassadeur/PresentationFondateurs";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { RechercheCommune } from "~/composants/fondateurs/RechercheCommune";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { ResultatRecherche } from "~/types/compte";

type Props = {
  /** « candidater » : nouvelle candidature ; « preciser » : candidature envoyée sans commune ; « changer » : en attente */
  mode: "candidater" | "preciser" | "changer";
  /** Ce qui est écrit dans le champ (la recherche d'avant, ou la ville du compte) */
  saisie: string;
  resultat: ResultatRecherche;
  /** Vrai juste après un envoi refusé faute de place (le focus va au message « au complet ») */
  apresEnvoiPlein?: boolean;
};

const ID = "fondateur-commune";
const titres = { candidater: "1. Ta commune", preciser: "Précise ta commune", changer: "Change de commune" };
const textes = {
  candidater: "Là où tu vis. Si ta commune a moins de 50 000 habitants, tu candidates pour ton département (ou ta collectivité d'outre-mer).",
  preciser: "Ta candidature est arrivée avant les fondateurs par ville : dis-nous où tu vis, pour qu'elle compte pour ta ville (ou ton département).",
  changer: "Tant que l'équipe n'a pas répondu, ta candidature peut changer de commune.",
};

/**
 * Choix de la commune d'une candidature « fondateur » : recherche (formulaire GET sans JavaScript, suggestions avec),
 * puis les places de sa zone ; ensuite le formulaire de candidature, ou le bouton qui précise (ou change) la commune
 * d'une candidature en attente. Zone au complet : le message, et l'on peut choisir une autre commune.
 */
export function ChoixCommuneFondateur({ mode, saisie, resultat, apresEnvoiPlein = false }: Props) {
  const zone = resultat.etat === "zone" ? resultat : null;
  return (
    <div className="grid gap-8">
      <section aria-labelledby={`${ID}-titre`} id="choix-commune" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <h2 id={`${ID}-titre`} className="text-2xl font-extrabold">{titres[mode]}</h2>
        <p className="mt-1.5 mb-5 text-gris">{lierPonctuation(textes[mode])}</p>
        <RechercheCommune
          id={ID}
          page="/espace/fondateur"
          ancre="choix-commune"
          libelle="Ta commune"
          aide="Son nom ou ton code postal."
          valeurInitiale={zone ? zone.commune.nom : saisie}
          choix={resultat.etat === "choix" ? resultat.communes : null}
          message={resultat.etat === "message" ? resultat.message : null}
          bouton="Voir les places"
          garder={mode === "changer" ? { changer: "1" } : {}}
        />
        <div role="status" className={zone ? "mt-6" : ""}>
          {zone && <PlacesZone commune={zone.commune} zone={zone.zone} />}
        </div>
        {mode === "changer" && (
          <p className="mt-5">
            <Link to="/espace/fondateur" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
              Garder ma commune
            </Link>
          </p>
        )}
      </section>

      {zone && zone.zone.libres === 0 && <FondateursAuComplet zone={zone.zone} idRecherche={`${ID}-recherche`} apresEnvoi={apresEnvoiPlein} />}

      {zone && zone.zone.libres > 0 && mode === "candidater" && (
        <>
          <PresentationFondateurs />
          <div>
            <h2 className="mb-4 text-2xl font-extrabold">2. Ta candidature</h2>
            <FormulaireCandidature communeCode={zone.commune.code} />
          </div>
        </>
      )}

      {zone && zone.zone.libres > 0 && mode !== "candidater" && (
        <FormulaireCompte nom="commune" bouton={`Choisir ${zone.commune.nom}`} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
          <input type="hidden" name="communeCode" value={zone.commune.code} />
          <p className="text-lg">
            {lierPonctuation(`Ta candidature comptera pour ${zone.zone.type === "ville" ? zone.zone.nom : `ton département (${zone.zone.nom})`}.`)}
          </p>
        </FormulaireCompte>
      )}
    </div>
  );
}
