import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { site } from "~/contenus/legal/informations-legales";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Le prénom recopié « Déniché par » sur la fiche d'un lieu accepté n'est pas lié au compte : il y reste (voir la politique
// de confidentialité), sauf si la personne demande à l'équipe de le retirer
const avertissement = `Ton compte est effacé tout de suite, avec tes points, tes badges, ta candidature, tes missions et tes messages. Les lieux que tu as proposés restent chez nous, mais plus rattachés à ton compte. Si l'un d'eux affiche « Déniché par » et ton prénom, ton prénom y reste : écris-nous à ${site.emailContact} pour qu'on le retire. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`;

/** « Supprimer mon compte » dans « Mon compte » : un avertissement clair, puis le mot de passe pour confirmer. */
export function FormulaireSupprimerCompte() {
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
