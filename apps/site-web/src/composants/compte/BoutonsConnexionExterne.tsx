import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { TEXTES_CONNEXION_EXTERNE_PAR_LANGUE, type CodeConnexionExterne } from "~/contenus/connexion-externe";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne, PageDepart } from "~/types/connexion-externe";

type Props = {
  /** Les fournisseurs réglés sur le serveur (un fournisseur sans réglage n'a pas de bouton) */
  fournisseurs: Record<FournisseurExterne, boolean>;
  /** La page qui montre les boutons : on y revient si Apple ou Google refuse, ou si on annule */
  depart: PageDepart;
  /** Chemin à rouvrir après la connexion */
  retour?: string | null;
  /** Message de « ?externe=… » (annulé, refusé, trop long…) */
  message?: CodeConnexionExterne | null;
  /** Ligne entre les boutons et le formulaire par e-mail */
  separateur?: string;
};

/**
 * « Continuer avec Apple » et « Continuer avec Google », au-dessus du formulaire par e-mail : rien sans fournisseur réglé.
 * Le message d'un essai raté est annoncé aux lecteurs d'écran (role="status").
 */
export function BoutonsConnexionExterne({ fournisseurs, depart, retour, message, separateur }: Props) {
  const T = utiliserTextes(TEXTES_CONNEXION_EXTERNE_PAR_LANGUE);
  const actifs = (["apple", "google"] as const).filter((fournisseur) => fournisseurs[fournisseur]);
  if (actifs.length === 0) return null;
  return (
    <div className="mb-6">
      {message && (
        <p role="status" className="mb-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 font-semibold">
          {lierPonctuation(T.messages[message])}
        </p>
      )}
      <ul className="grid gap-3" aria-label={T.autreCompte}>
        {actifs.map((fournisseur) => (
          <li key={fournisseur}><BoutonFournisseur fournisseur={fournisseur} adresse={construireAdresseDepart(fournisseur, depart, retour)} /></li>
        ))}
      </ul>
      <p className="mt-6 flex items-center gap-4 text-sm font-semibold text-gris">
        <span aria-hidden="true" className="h-0.5 flex-1 bg-encre/15" />{separateur ?? T.separateur}<span aria-hidden="true" className="h-0.5 flex-1 bg-encre/15" />
      </p>
    </div>
  );
}
