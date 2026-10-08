import { Link } from "react-router";

import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/** Formulaire de connexion (action de routes/compte/connexion.tsx). « retour » : la page à rouvrir ensuite. */
export function FormulaireConnexion({ retour }: { retour: string | null }) {
  return (
    <FormulaireCompte
      nom="connexion"
      bouton="Se connecter"
      boutonEnvoi="Connexion…"
      className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10"
      apres={<Link to="/mot-de-passe-oublie" className={`text-sm ${classeLien}`}>{lierPonctuation("Mot de passe oublié ?")}</Link>}
    >
      {retour && <input type="hidden" name="retour" value={retour} />}
      <div className="grid gap-5">
        <ChampTexte nom="email" libelle="Ton e-mail" type="email" autoComplete="email" inputMode="email" maximum={254} />
        <ChampTexte nom="motDePasse" libelle="Ton mot de passe" type="password" autoComplete="current-password" />
      </div>
    </FormulaireCompte>
  );
}
