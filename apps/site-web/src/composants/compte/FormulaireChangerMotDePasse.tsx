import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_MOT_DE_PASSE_PAR_LANGUE } from "~/contenus/mot-de-passe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE).changer;
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  return (
    <FormulaireCompte nom="mot-de-passe" bouton={T.bouton} viderApresReussite reponseParDefaut={confirmation}>
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <div className="grid gap-5">
        <ChampTexte nom="actuel" libelle={champs.motDePasseActuel} type="password" autoComplete="current-password" />
        <ChampTexte
          nom="nouveau"
          libelle={champs.nouveauMotDePasse}
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation(champs.aideMotDePasse)}
        />
      </div>
    </FormulaireCompte>
  );
}
