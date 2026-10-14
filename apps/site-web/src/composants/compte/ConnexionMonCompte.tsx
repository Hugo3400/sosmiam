import { BoutonsConnexionExterne } from "~/composants/compte/BoutonsConnexionExterne";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import { AIDE_APPLE_GOOGLE } from "~/contenus/mon-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne } from "~/types/connexion-externe";

type Props = {
  /** Adresse de « Mot de passe oublié ? » (sur sosmiam.fr, celle de l'espace ambassadeur : le lien reçu y mène aussi) */
  adresseOubli: string;
  /** « Continuer avec Apple / Google » : les boutons réglés, et le message d'un essai raté */
  fournisseurs: Record<FournisseurExterne, boolean>;
  messageExterne: string | null;
};

/**
 * « Me connecter » dans le « Mon compte » de sosmiam.fr : la connexion dans la page même (le cookie de session est propre
 * à chaque hôte : une connexion faite sur ambassadeur.sosmiam.fr ne servirait pas ici) : Apple, Google, ou e-mail et
 * mot de passe ; et l'aide pour un compte créé avec Apple ou Google, qui n'a pas de mot de passe.
 */
export function ConnexionMonCompte({ adresseOubli, fournisseurs, messageExterne }: Props) {
  return (
    <section aria-labelledby="me-connecter">
      <h2 id="me-connecter" className="mb-5 text-2xl font-extrabold">Me connecter</h2>
      <div className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <BoutonsConnexionExterne fournisseurs={fournisseurs} depart="/mon-compte" message={messageExterne} />
        <FormulaireConnexion retour={null} adresseOubli={adresseOubli} sansCadre />
      </div>
      <p className="mt-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4">
        <span aria-hidden="true">🍏 </span>{lierPonctuation(AIDE_APPLE_GOOGLE)}
      </p>
    </section>
  );
}
