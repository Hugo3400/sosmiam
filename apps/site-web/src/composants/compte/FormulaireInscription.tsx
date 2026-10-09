import { Link } from "react-router";

import { CaseACocher } from "~/composants/compte/CaseACocher";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import type { EspaceCompte } from "~/fonctions/hotes/lire-espace-hote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * Ce qui change sur pro.sosmiam.fr : l'aide du prénom, les conditions (partie « L'espace pro »), le petit mot sous le
 * formulaire et la confidentialité (partie « Ton espace pro »). Ville et quartier ne sont demandés qu'aux ambassadeurs.
 */
const textes: Record<EspaceCompte, { aidePrenom: string; cgu: string; apres: string; confidentialite: string }> = {
  ambassadeur: {
    aidePrenom: "Il pourra s'afficher « Déniché par … » sur la fiche d'un lieu que tu as proposé.",
    cgu: "https://sosmiam.fr/cgu#ambassadeurs",
    apres: "L'équipe lit chaque inscription avant d'ouvrir ton espace. Ce compte sera aussi celui de l'app SOS Miam quand elle sortira. Ce qu'on fait de tes données : ",
    confidentialite: "https://sosmiam.fr/confidentialite#compte-ambassadeur",
  },
  pro: {
    aidePrenom: "Ton équipe le verra quand tu l'inviteras.",
    cgu: "https://sosmiam.fr/cgu#pro",
    apres: "Un seul compte SOS Miam : le même pour l'app quand elle sortira. Ce qu'on fait de tes données : ",
    confidentialite: "https://sosmiam.fr/confidentialite#compte-pro",
  },
};

/** Formulaire « Créer mon compte » de l'espace ambassadeur ou de l'espace pro (action de routes/compte/inscription.tsx). */
export function FormulaireInscription({ espace = "ambassadeur" }: { espace?: EspaceCompte }) {
  const texte = textes[espace];
  return (
    <FormulaireCompte
      nom="inscription"
      bouton="Créer mon compte"
      piege
      className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
      apres={<p className="text-sm text-gris">{lierPonctuation("Déjà un compte ? ")}<Link to="/connexion" className={classeLien}>Connecte-toi</Link></p>}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <ChampTexte
          nom="prenom"
          libelle="Ton prénom (ou un surnom)"
          autoComplete="given-name"
          maximum={40}
          aide={lierPonctuation(texte.aidePrenom)}
          className="sm:col-span-2"
        />
        <ChampTexte nom="email" libelle="Ton e-mail" type="email" autoComplete="email" inputMode="email" maximum={254} exemple="ton@email.fr" className="sm:col-span-2" />
        <ChampTexte
          nom="motDePasse"
          libelle="Ton mot de passe"
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation("12 caractères au moins (16 si ce ne sont que des chiffres). Astuce : une petite phrase marche très bien.")}
          className="sm:col-span-2"
        />
        <ChampTexte
          nom="dateNaissance"
          libelle="Ta date de naissance"
          type="date"
          autoComplete="bday"
          aide="Elle sert seulement à vérifier que tu as 18 ans. On ne la garde pas."
          className="sm:col-span-2"
        />
        {espace === "ambassadeur" && (
          <>
            <ChampTexte nom="ville" libelle="Ta ville" autoComplete="address-level2" maximum={80} />
            <ChampTexte nom="quartier" libelle="Ton quartier" facultatif maximum={80} />
          </>
        )}
      </div>
      <div className="mt-7">
        <CaseACocher nom="cgu">
          {/* L'espace reste dans la chaîne : seule, Chrome la perdrait pour les lecteurs d'écran (« lesconditions ») */}
          {"J'accepte les "}
          <a href={texte.cgu} target="_blank" rel="noopener" className={classeLien}>
            conditions d'utilisation<span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
          </a>
        </CaseACocher>
      </div>
      <p className="mt-5 text-sm text-gris">
        {lierPonctuation(texte.apres)}
        <a href={texte.confidentialite} target="_blank" rel="noopener" className={classeLien}>
          confidentialité<span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
        </a>.
      </p>
    </FormulaireCompte>
  );
}
