import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import { AIDE_APPLE_GOOGLE } from "~/contenus/mon-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Adresse de « Mot de passe oublié ? » (sur sosmiam.fr, celle de l'espace ambassadeur : le lien reçu y mène aussi) */
  adresseOubli: string;
};

/**
 * « Me connecter » dans le « Mon compte » de sosmiam.fr : la connexion dans la page même (le cookie de session est propre
 * à chaque hôte : une connexion faite sur ambassadeur.sosmiam.fr ne servirait pas ici), et l'aide pour un compte créé
 * avec Apple ou Google, qui n'a pas encore de mot de passe.
 */
export function ConnexionMonCompte({ adresseOubli }: Props) {
  return (
    <section aria-labelledby="me-connecter">
      <h2 id="me-connecter" className="mb-5 text-2xl font-extrabold">Me connecter</h2>
      <FormulaireConnexion retour={null} adresseOubli={adresseOubli} />
      <p className="mt-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4">
        <span aria-hidden="true">🍏 </span>{lierPonctuation(AIDE_APPLE_GOOGLE)}
      </p>
    </section>
  );
}
