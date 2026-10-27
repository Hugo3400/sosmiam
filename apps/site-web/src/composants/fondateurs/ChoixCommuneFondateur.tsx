import { Link } from "react-router";

import { FondateursAuComplet } from "~/composants/ambassadeur/FondateursAuComplet";
import { FormulaireCandidature } from "~/composants/ambassadeur/FormulaireCandidature";
import { PresentationFondateurs } from "~/composants/ambassadeur/PresentationFondateurs";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { PlacesZone } from "~/composants/fondateurs/PlacesZone";
import { RechercheCommune } from "~/composants/fondateurs/RechercheCommune";
import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE } from "~/contenus/recherche-commune";
import { ecrireMessageRecherche } from "~/fonctions/fondateurs/ecrire-message-recherche";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
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

/**
 * Choix de la commune d'une candidature « fondateur » : recherche (formulaire GET sans JavaScript, suggestions avec),
 * puis les places de sa zone ; ensuite le formulaire de candidature, ou le bouton qui précise (ou change) la commune
 * d'une candidature en attente. Zone au complet : le message, et l'on peut choisir une autre commune.
 */
export function ChoixCommuneFondateur({ mode, saisie, resultat, apresEnvoiPlein = false }: Props) {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE).choix;
  const textesRecherche = utiliserTextes(TEXTES_RECHERCHE_COMMUNE_PAR_LANGUE);
  const zone = resultat.etat === "zone" ? resultat : null;
  return (
    <div className="grid gap-8">
      <section aria-labelledby={`${ID}-titre`} id="choix-commune" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <h2 id={`${ID}-titre`} className="text-2xl font-extrabold">{T.titres[mode]}</h2>
        <p className="mt-1.5 mb-5 text-gris">{lierPonctuation(T.textes[mode])}</p>
        <RechercheCommune
          id={ID}
          page="/espace/fondateur"
          ancre="choix-commune"
          libelle={T.libelle}
          aide={T.aide}
          valeurInitiale={zone ? zone.commune.nom : saisie}
          choix={resultat.etat === "choix" ? resultat.communes : null}
          message={resultat.etat === "message" ? ecrireMessageRecherche(resultat, textesRecherche) : null}
          bouton={T.bouton}
          garder={mode === "changer" ? { changer: "1" } : {}}
        />
        <div role="status" className={zone ? "mt-6" : ""}>
          {zone && <PlacesZone commune={zone.commune} zone={zone.zone} />}
        </div>
        {mode === "changer" && (
          <p className="mt-5">
            <Link to="/espace/fondateur" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
              {T.garder}
            </Link>
          </p>
        )}
      </section>

      {zone && zone.zone.libres === 0 && <FondateursAuComplet zone={zone.zone} idRecherche={`${ID}-recherche`} apresEnvoi={apresEnvoiPlein} />}

      {zone && zone.zone.libres > 0 && mode === "candidater" && (
        <>
          <PresentationFondateurs />
          <div>
            <h2 className="mb-4 text-2xl font-extrabold">{T.titreCandidature}</h2>
            <FormulaireCandidature communeCode={zone.commune.code} />
          </div>
        </>
      )}

      {zone && zone.zone.libres > 0 && mode !== "candidater" && (
        <FormulaireCompte nom="commune" bouton={T.choisir(zone.commune.nom)} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
          <input type="hidden" name="communeCode" value={zone.commune.code} />
          <p className="text-lg">
            {lierPonctuation(T.comptera(zone.zone))}
          </p>
        </FormulaireCompte>
      )}
    </div>
  );
}
