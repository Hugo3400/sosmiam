import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { site } from "~/contenus/legal/informations-legales";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne, PageDepart } from "~/types/connexion-externe";

// Le prénom recopié « Déniché par » sur la fiche d'un lieu accepté n'est pas lié au compte : il y reste (voir la politique
// de confidentialité), sauf si la personne demande à l'équipe de le retirer
const avertissementAmbassadeur = `Ton compte est effacé tout de suite, avec tes points, tes badges, ta candidature, tes missions et tes messages. Les lieux que tu as proposés restent chez nous, mais plus rattachés à ton compte. Si l'un d'eux affiche « Déniché par » et ton prénom, ton prénom y reste : écris-nous à ${site.emailContact} pour qu'on le retire. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`;

// Espace pro : les infos mises sur la fiche d'un lieu appartiennent à la fiche (publiées sans nom), elles y restent ; le lieu
// n'est plus « Vérifié ✓ » s'il n'a plus aucun rattachement validé
const avertissementPro = `Ton compte est effacé tout de suite, avec tes rattachements aux lieux (ta place dans leur équipe comprise), tes demandes en cours, tes points et tes badges. Ce que tu as mis sur la fiche d'un lieu y reste, sans ton nom. Si tu étais le seul à tenir un lieu, il perd son « Vérifié ✓ » jusqu'à ce que quelqu'un d'autre le reprenne. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`;

// Compte sans rôle d'ambassadeur ni lieu (créé dans l'app, par exemple), dans le « Mon compte » de sosmiam.fr
const avertissementCompte = "Ton compte est effacé tout de suite, avec tout ce qui y est rattaché : ton profil, tes points, tes badges et tes connexions, dans l'app comme sur le site. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.";

type Props = {
  /**
   * Ce que l'avertissement met en avant : l'espace ambassadeur (par défaut), l'espace pro, ou un compte sans l'un ni l'autre
   * (« compte »)
   */
  espace?: "ambassadeur" | "pro" | "compte";
  /**
   * Compte sans mot de passe (créé avec Apple ou Google) : confirmé en se reconnectant avec le compte lié. « lies » : les
   * fournisseurs liés ET réglés sur le site ; « pret » : le fournisseur vient de confirmer (dernière étape) ; « depart » :
   * cette page ; « message » : celui d'un essai raté.
   */
  sansMotDePasse?: { lies: FournisseurExterne[]; pret: FournisseurExterne | null; depart: PageDepart; message: string | null };
};

const noms = { apple: "Apple", google: "Google" } as const;

/** « Supprimer mon compte » dans « Mon compte » : un avertissement clair, puis le mot de passe pour confirmer. */
export function FormulaireSupprimerCompte({ espace = "ambassadeur", sansMotDePasse }: Props) {
  const avertissement = { ambassadeur: avertissementAmbassadeur, pro: avertissementPro, compte: avertissementCompte }[espace];
  const encadre = (
    <div className="mb-5 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-4 py-3 text-encre">
      <p className="font-semibold">{lierPonctuation("Attention : c'est définitif.")}</p>
      <p className="mt-1">{lierPonctuation(avertissement)}</p>
    </div>
  );
  if (!sansMotDePasse) {
    return (
      <FormulaireCompte nom="suppression" bouton="Supprimer mon compte" boutonEnvoi="Suppression…" danger>
        {encadre}
        <ChampTexte nom="motDePasse" libelle="Ton mot de passe, pour confirmer" type="password" autoComplete="current-password" />
      </FormulaireCompte>
    );
  }
  const { lies, pret, depart, message } = sansMotDePasse;
  // Dernière étape : Apple ou Google vient de confirmer que c'est bien toi (jeton gardé côté serveur, 10 minutes)
  if (pret) {
    return (
      <FormulaireCompte nom="suppression-externe" bouton="Supprimer définitivement mon compte" boutonEnvoi="Suppression…" danger>
        {encadre}
        <p className="mb-5 font-semibold">{lierPonctuation(`${noms[pret]} a confirmé que c'est bien toi. Dernière étape : le bouton ci-dessous.`)}</p>
      </FormulaireCompte>
    );
  }
  return (
    <div>
      {encadre}
      {message && <p role="status" className="mb-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 font-semibold">{lierPonctuation(message)}</p>}
      {lies.length > 0 ? (
        <>
          <p className="mb-4">{lierPonctuation("Ton compte n'a pas de mot de passe : pour confirmer, reconnecte-toi avec le compte lié.")}</p>
          <ul className="grid max-w-sm gap-3">
            {lies.map((fournisseur) => (
              <li key={fournisseur}>
                <BoutonFournisseur fournisseur={fournisseur} adresse={construireAdresseDepart(fournisseur, depart, null, "suppression")} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{lierPonctuation(`Ton compte n'a pas de mot de passe : choisis-en un avec « Mot de passe oublié ? », ou écris-nous à ${site.emailContact} pour qu'on l'efface.`)}</p>
      )}
    </div>
  );
}
