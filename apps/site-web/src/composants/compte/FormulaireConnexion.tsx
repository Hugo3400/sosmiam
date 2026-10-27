import { Link } from "react-router";

import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_CONNEXION_COMPTE_PAR_LANGUE } from "~/contenus/connexion-compte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

type Props = {
  /** La page à rouvrir ensuite */
  retour: string | null;
  /**
   * Adresse de « Mot de passe oublié ? » : /mot-de-passe-oublie (lien du routeur), ou une adresse complète vers un autre
   * site (« Mon compte » de sosmiam.fr → ambassadeur.sosmiam.fr), alors en lien classique
   */
  adresseOubli?: string;
  /** Déjà dans un cadre (avec les boutons Apple et Google, dans « Mon compte ») : pas de cadre à lui */
  sansCadre?: boolean;
};

/**
 * Formulaire de connexion (action de routes/compte/connexion.tsx, et de routes/compte/mon-compte.tsx sur sosmiam.fr).
 */
export function FormulaireConnexion({ retour, adresseOubli = "/mot-de-passe-oublie", sansCadre = false }: Props) {
  const T = utiliserTextes(TEXTES_CONNEXION_COMPTE_PAR_LANGUE);
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const texteOubli = lierPonctuation(T.motDePasseOublie);
  const lienOubli = adresseOubli.startsWith("https://")
    ? <a href={adresseOubli} className={`text-sm ${classeLien}`}>{texteOubli}</a>
    : <Link to={adresseOubli} className={`text-sm ${classeLien}`}>{texteOubli}</Link>;
  return (
    <FormulaireCompte
      nom="connexion"
      bouton={T.seConnecter}
      boutonEnvoi={T.connexionEnCours}
      className={sansCadre ? "" : "rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"}
      apres={lienOubli}
    >
      {retour && <input type="hidden" name="retour" value={retour} />}
      <div className="grid gap-5">
        <ChampTexte nom="email" libelle={champs.email} type="email" autoComplete="email" inputMode="email" maximum={254} />
        <ChampTexte nom="motDePasse" libelle={champs.motDePasse} type="password" autoComplete="current-password" />
      </div>
    </FormulaireCompte>
  );
}
