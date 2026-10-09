import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Le prénom recopié « Déniché par » sur la fiche d'un lieu accepté n'est pas lié au compte : il y reste (voir la politique
// de confidentialité), sauf si la personne demande à l'équipe de le retirer
const avertissementAmbassadeur = `Ton compte est effacé tout de suite, avec tes points, tes badges, ta candidature, tes missions et tes messages. Les lieux que tu as proposés restent chez nous, mais plus rattachés à ton compte. Si l'un d'eux affiche « Déniché par » et ton prénom, ton prénom y reste : écris-nous à ${site.emailContact} pour qu'on le retire. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`;

// Espace pro : les infos mises sur la fiche d'un lieu appartiennent à la fiche (publiées sans nom), elles y restent ; le lieu
// n'est plus « Vérifié ✓ » s'il n'a plus aucun rattachement validé
const avertissementPro = `Ton compte est effacé tout de suite, avec tes rattachements aux lieux (ta place dans leur équipe comprise), tes demandes en cours, tes points et tes badges. Ce que tu as mis sur la fiche d'un lieu y reste, sans ton nom. Si tu étais le seul à tenir un lieu, il perd son « Vérifié ✓ » jusqu'à ce que quelqu'un d'autre le reprenne. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`;

type Props = {
  /** L'espace qui sert « Mon compte » : l'avertissement parle de ce qui y compte (par défaut, l'espace ambassadeur) */
  espace?: "ambassadeur" | "pro";
};

/** « Supprimer mon compte » dans « Mon compte » : un avertissement clair, puis le mot de passe pour confirmer. */
export function FormulaireSupprimerCompte({ espace = "ambassadeur" }: Props) {
  const avertissement = espace === "pro" ? avertissementPro : avertissementAmbassadeur;
  return (
    <FormulaireCompte nom="suppression" bouton="Supprimer mon compte" boutonEnvoi="Suppression…" danger>
      <div className="mb-5 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-4 py-3 text-encre">
        <p className="font-semibold">{lierPonctuation("Attention : c'est définitif.")}</p>
        <p className="mt-1">{lierPonctuation(avertissement)}</p>
      </div>
      <ChampTexte nom="motDePasse" libelle="Ton mot de passe, pour confirmer" type="password" autoComplete="current-password" />
    </FormulaireCompte>
  );
}
