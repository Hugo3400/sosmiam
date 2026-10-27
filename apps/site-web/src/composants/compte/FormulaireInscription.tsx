import { Link } from "react-router";

import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE } from "~/contenus/inscription-compte";
import { site } from "~/contenus/legal/informations-legales";
import type { EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Ce qui change sur pro.sosmiam.fr : l'aide du prénom, les conditions (partie « L'espace pro »), le petit mot sous le
 * formulaire et la confidentialité (partie « Ton espace pro »). Ville et quartier ne sont demandés qu'aux ambassadeurs.
 */
const ADRESSES: Record<EspaceCompte, { cgu: string; confidentialite: string }> = {
  ambassadeur: { cgu: "/cgu#ambassadeurs", confidentialite: "/confidentialite#compte-ambassadeur" },
  pro: { cgu: "/cgu#pro", confidentialite: "/confidentialite#compte-pro" },
};

/** Formulaire « Créer mon compte » de l'espace ambassadeur ou de l'espace pro (action de routes/compte/inscription.tsx). */
export function FormulaireInscription({ espace = "ambassadeur" }: { espace?: EspaceCompte }) {
  const T = utiliserTextes(TEXTES_INSCRIPTION_COMPTE_PAR_LANGUE);
  const { champs, conditions } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const lien = utiliserLienLangue();
  const texte = T.espaces[espace];
  const adresses = ADRESSES[espace];
  return (
    <FormulaireCompte
      nom="inscription"
      bouton={T.creerMonCompte}
      piege
      className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
      apres={<p className="text-sm text-gris">{lierPonctuation(T.dejaUnCompte)}<Link to="/connexion" className={classeLien}>{T.connecteToi}</Link></p>}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <ChampTexte
          nom="prenom"
          libelle={champs.prenom}
          autoComplete="given-name"
          maximum={40}
          aide={lierPonctuation(texte.aidePrenom)}
          className="sm:col-span-2"
        />
        <ChampTexte nom="email" libelle={champs.email} type="email" autoComplete="email" inputMode="email" maximum={254} exemple={champs.exempleEmail} className="sm:col-span-2" />
        <ChampTexte
          nom="motDePasse"
          libelle={champs.motDePasse}
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation(champs.aideMotDePasse)}
          className="sm:col-span-2"
        />
        <ChampTexte
          nom="dateNaissance"
          libelle={champs.dateNaissance}
          type="date"
          autoComplete="bday"
          aide={T.aideDateNaissance}
          className="sm:col-span-2"
        />
        {espace === "ambassadeur" && (
          <>
            <ChampTexte nom="ville" libelle={champs.ville} autoComplete="address-level2" maximum={80} />
            <ChampTexte nom="quartier" libelle={champs.quartier} facultatif maximum={80} />
          </>
        )}
      </div>
      <div className="mt-7 grid gap-4">
        <CaseACocher nom="cgu">
          {/* L'espace reste dans la chaîne : seule, Chrome la perdrait pour les lecteurs d'écran (« lesconditions ») */}
          {conditions.jAccepte}
          <a href={`https://${site.adresse}${lien(adresses.cgu)}`} target="_blank" rel="noopener" className={classeLien}>
            {conditions.lien}<span className="sr-only">{conditions.nouvelOnglet}</span>
          </a>
        </CaseACocher>
        {espace === "ambassadeur" && (
          <>
            {/* Dit à l'action que la case était là : sans lui (page affichée avant la case), aucun « non » n'est retenu */}
            <input type="hidden" name="newsletterProposee" value="oui" />
            <CaseACocher nom="newsletter" facultatif cocheeParDefaut>{lierPonctuation(T.newsletter)}</CaseACocher>
          </>
        )}
      </div>
      <p className="mt-5 text-sm text-gris">
        {lierPonctuation(texte.apres)}
        <a href={`https://${site.adresse}${lien(adresses.confidentialite)}`} target="_blank" rel="noopener" className={classeLien}>
          {conditions.confidentialite}<span className="sr-only">{conditions.nouvelOnglet}</span>
        </a>.
      </p>
    </FormulaireCompte>
  );
}
