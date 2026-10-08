import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * « Mon mot de passe » dans « Mon compte » : l'actuel, puis le nouveau. Les autres connexions sont fermées ensuite.
 * L'e-mail, caché et jamais envoyé, dit aux gestionnaires de mots de passe à quel compte rattacher le nouveau.
 */
export function FormulaireChangerMotDePasse({ email }: { email: string }) {
  return (
    <FormulaireCompte nom="mot-de-passe" bouton="Changer mon mot de passe" viderApresReussite>
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div className="grid gap-5">
        <ChampTexte nom="actuel" libelle="Ton mot de passe actuel" type="password" autoComplete="current-password" />
        <ChampTexte
          nom="nouveau"
          libelle="Ton nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation("12 caractères au moins. Astuce : une petite phrase marche très bien.")}
        />
      </div>
    </FormulaireCompte>
  );
}
