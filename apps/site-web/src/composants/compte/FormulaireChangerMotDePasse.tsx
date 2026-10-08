import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  email: string;
  /** « C'est fait ! » : le mot de passe vient d'être changé (la page y revient par une redirection, sans réponse d'action) */
  confirmation?: ReponseFormulaire;
};

/**
 * « Mon mot de passe » dans « Mon compte » : l'actuel, puis le nouveau. Toutes les connexions du compte sont fermées
 * ensuite, et celle-ci continue avec un nouveau jeton (routes/compte/mon-compte.tsx).
 * L'e-mail, caché et jamais envoyé, dit aux gestionnaires de mots de passe à quel compte rattacher le nouveau.
 */
export function FormulaireChangerMotDePasse({ email, confirmation }: Props) {
  return (
    <FormulaireCompte nom="mot-de-passe" bouton="Changer mon mot de passe" viderApresReussite reponseParDefaut={confirmation}>
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div className="grid gap-5">
        <ChampTexte nom="actuel" libelle="Ton mot de passe actuel" type="password" autoComplete="current-password" />
        <ChampTexte
          nom="nouveau"
          libelle="Ton nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation("12 caractères au moins, et pas seulement des chiffres. Astuce : une petite phrase marche très bien.")}
        />
      </div>
    </FormulaireCompte>
  );
}
