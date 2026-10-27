import { BoutonsConnexionExterne } from "~/composants/compte/BoutonsConnexionExterne";
import { ConnexionParQr } from "~/composants/compte/ConnexionParQr";
import { FormulaireConnexion } from "~/composants/compte/FormulaireConnexion";
import type { CodeConnexionExterne } from "~/contenus/connexion-externe";
import { TEXTES_MON_COMPTE_PAR_LANGUE } from "~/contenus/mon-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { QrAffiche } from "~/types/connexion-qr";

type Props = {
  /** Adresse de « Mot de passe oublié ? » (sur sosmiam.fr, celle de l'espace ambassadeur : le lien reçu y mène aussi) */
  adresseOubli: string;
  /** « Continuer avec Apple / Google » : les boutons réglés, et le message d'un essai raté */
  fournisseurs: Record<FournisseurExterne, boolean>;
  messageExterne: CodeConnexionExterne | null;
  /** « Me connecter avec l'app » : le QR redessiné par la page (retour sans JavaScript), sinon null */
  qr: QrAffiche | null;
};

/**
 * « Me connecter » dans le « Mon compte » de sosmiam.fr : la connexion dans la page même (le cookie de session est propre
 * à chaque hôte : une connexion faite sur ambassadeur.sosmiam.fr ne servirait pas ici) : Apple, Google, ou e-mail et
 * mot de passe ; et l'aide pour un compte créé avec Apple ou Google, qui n'a pas de mot de passe.
 */
export function ConnexionMonCompte({ adresseOubli, fournisseurs, messageExterne, qr }: Props) {
  const T = utiliserTextes(TEXTES_MON_COMPTE_PAR_LANGUE);
  return (
    <section aria-labelledby="me-connecter">
      <h2 id="me-connecter" className="mb-5 text-2xl font-extrabold">{T.parties.meConnecter}</h2>
      <div className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <BoutonsConnexionExterne fournisseurs={fournisseurs} depart="/mon-compte" message={messageExterne} />
        <FormulaireConnexion retour={null} adresseOubli={adresseOubli} sansCadre />
      </div>
      <ConnexionParQr depart="/mon-compte" initial={qr} />
      <p className="mt-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4">
        <span aria-hidden="true">🍏 </span>{lierPonctuation(T.aideAppleGoogle)}
      </p>
    </section>
  );
}
