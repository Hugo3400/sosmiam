import { useActionData } from "react-router";

import { ConfirmationConnexion } from "~/composants/compte/ConfirmationConnexion";
import { DelierConnexion } from "~/composants/compte/DelierConnexion";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { LigneConnexion } from "~/composants/compte/LigneConnexion";
import { LogoApple } from "~/composants/compte/LogoApple";
import { LogoGoogle } from "~/composants/compte/LogoGoogle";
import { PartieCompte } from "~/composants/compte/PartieCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { AIDE_AJOUTER_MOT_DE_PASSE, AVERTISSEMENT_RELAIS_APPLE, CHAPO_MES_CONNEXIONS } from "~/contenus/mes-connexions";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const noms = { apple: "Apple", google: "Google" } as const;
const logos = { apple: <LogoApple className="h-5 w-5" />, google: <LogoGoogle className="h-5 w-5" /> };

/**
 * « Mes façons de me connecter » dans « Mon compte » : e-mail et mot de passe, Google, Apple (seulement si le site sait
 * le proposer, ou s'il est déjà relié). Null : l'API n'a pas répondu, la partie le dit simplement.
 */
export function PartieMesConnexions({ connexions }: { connexions: MesConnexions | null }) {
  // Un formulaire de la page vient de répondre : le message de l'adresse (relié, délié…) date d'avant, on ne le montre plus
  const reponse = useActionData();
  if (!connexions) {
    return (
      <PartieCompte id="mes-connexions" titre="Mes façons de me connecter">
        <p className="text-gris">{lierPonctuation("On n'arrive pas à lire tes façons de te connecter pour l'instant. Recharge la page dans un petit moment !")}</p>
      </PartieCompte>
    );
  }
  const { motDePasse, actifs, pret, email, relaisApple, depart } = connexions;
  const message = reponse ? null : connexions.message;
  const fournisseurs = (["google", "apple"] as const).filter((fournisseur) => actifs[fournisseur] || connexions[fournisseur]);

  const ligneFournisseur = (fournisseur: FournisseurExterne) => {
    const relie = connexions[fournisseur];
    const relier = !relie && actifs[fournisseur] && (
      <Bouton href={construireAdresseDepart(fournisseur, depart, null, "relier")} variante="blanc" petit>
        Relier<span className="sr-only"> mon compte {noms[fournisseur]}</span>
      </Bouton>
    );
    return (
      <LigneConnexion key={fournisseur} icone={logos[fournisseur]} nom={noms[fournisseur]} actif={relie} etat={relie ? "Relié" : "Pas relié"} action={relier || undefined}>
        {relie ? <DelierConnexion fournisseur={fournisseur} connexions={connexions} /> : undefined}
      </LigneConnexion>
    );
  };

  return (
    <PartieCompte id="mes-connexions" titre="Mes façons de me connecter">
      <p className="mb-5 text-gris">{lierPonctuation(CHAPO_MES_CONNEXIONS)}</p>
      {message && (
        <p role="status" className={`mb-5 rounded-2xl border-2 border-encre px-5 py-4 font-semibold ${message.reussite ? "bg-jaune-clair" : "bg-rose-alerte"}`}>
          {message.reussite && <span aria-hidden="true">✓ </span>}{lierPonctuation(message.texte)}
        </p>
      )}
      {pret && <ConfirmationConnexion intention={pret.intention} fournisseur={pret.fournisseur} />}
      <ul className="grid gap-4">
        <LigneConnexion icone={<span aria-hidden="true">✉️</span>} nom="E-mail et mot de passe" actif={motDePasse} etat={motDePasse ? "Activé" : "Pas encore de mot de passe"}>
          {!motDePasse && (
            <FormulaireCompte nom="ajouter-mot-de-passe" bouton="Ajouter un mot de passe" boutonEnvoi="Envoi du lien…">
              <p className="mb-2">{lierPonctuation(AIDE_AJOUTER_MOT_DE_PASSE.replace("{email}", email))}</p>
              {relaisApple && <p className="mb-2 rounded-2xl border-2 border-encre bg-jaune-clair px-4 py-3">{lierPonctuation(AVERTISSEMENT_RELAIS_APPLE)}</p>}
            </FormulaireCompte>
          )}
        </LigneConnexion>
        {fournisseurs.map(ligneFournisseur)}
      </ul>
    </PartieCompte>
  );
}
