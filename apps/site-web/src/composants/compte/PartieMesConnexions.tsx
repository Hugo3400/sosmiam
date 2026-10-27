import { useActionData } from "react-router";

import { ConfirmationConnexion } from "~/composants/compte/ConfirmationConnexion";
import { DelierConnexion } from "~/composants/compte/DelierConnexion";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { LigneConnexion } from "~/composants/compte/LigneConnexion";
import { LogoApple } from "~/composants/compte/LogoApple";
import { LogoGoogle } from "~/composants/compte/LogoGoogle";
import { PartieCompte } from "~/composants/compte/PartieCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_MES_CONNEXIONS_PAR_LANGUE } from "~/contenus/mes-connexions";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lireMessageMesConnexions } from "~/fonctions/connexion-externe/lire-message-mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const noms = { apple: "Apple", google: "Google" } as const;
const autres = { apple: "google", google: "apple" } as const;
const logos = { apple: <LogoApple className="h-5 w-5" />, google: <LogoGoogle className="h-5 w-5" /> };

/**
 * « Mes façons de me connecter » dans « Mon compte » : e-mail et mot de passe, Google, Apple (seulement si le site sait
 * le proposer, ou s'il est déjà relié). Null : l'API n'a pas répondu, la partie le dit simplement.
 */
export function PartieMesConnexions({ connexions }: { connexions: MesConnexions | null }) {
  // Un formulaire de la page vient de répondre : le message de l'adresse (relié, délié…) date d'avant, on ne le montre plus
  const reponse = useActionData();
  const T = utiliserTextes(TEXTES_MES_CONNEXIONS_PAR_LANGUE);
  const langue = utiliserLangue();
  if (!connexions) {
    return (
      <PartieCompte id="mes-connexions" titre={T.titre}>
        <p className="text-gris">{lierPonctuation(T.illisible)}</p>
      </PartieCompte>
    );
  }
  const { motDePasse, actifs, pret, email, relaisApple, depart } = connexions;
  const message = reponse || !connexions.message ? null : lireMessageMesConnexions(connexions.message.code, connexions.message.avec, langue);
  const fournisseurs = (["google", "apple"] as const).filter((fournisseur) => actifs[fournisseur] || connexions[fournisseur]);

  const ligneFournisseur = (fournisseur: FournisseurExterne) => {
    const relie = connexions[fournisseur];
    const confirmable = motDePasse || actifs[autres[fournisseur]];
    const relier = !relie && actifs[fournisseur] && confirmable && (
      <Bouton href={construireAdresseDepart(fournisseur, depart, null, "relier")} variante="blanc" petit>
        {T.relier}<span className="sr-only">{T.monCompte(noms[fournisseur])}</span>
      </Bouton>
    );
    return (
      <LigneConnexion key={fournisseur} icone={logos[fournisseur]} nom={noms[fournisseur]} actif={relie} etat={relie ? T.relie : T.pasRelie} action={relier || undefined}>
        {relie ? (
          <DelierConnexion fournisseur={fournisseur} connexions={connexions} />
        ) : confirmable ? undefined : (
          <p className="text-gris">{lierPonctuation(T.pourRelier(noms[fournisseur]))}</p>
        )}
      </LigneConnexion>
    );
  };

  return (
    <PartieCompte id="mes-connexions" titre={T.titre}>
      <p className="mb-5 text-gris">{lierPonctuation(T.chapo)}</p>
      {message && (
        <p role="status" className={`mb-5 rounded-2xl border-2 border-encre px-5 py-4 font-semibold ${message.reussite ? "bg-jaune-clair" : "bg-rose-alerte"}`}>
          {message.reussite && <span aria-hidden="true">✓ </span>}{lierPonctuation(message.texte)}
        </p>
      )}
      {pret && <ConfirmationConnexion intention={pret.intention} fournisseur={pret.fournisseur} confirme={pret.confirme} connexions={connexions} />}
      <ul className="grid gap-4">
        <LigneConnexion icone={<span aria-hidden="true">✉️</span>} nom={T.emailEtMotDePasse} actif={motDePasse} etat={motDePasse ? T.active : T.pasDeMotDePasse}>
          {!motDePasse && (
            <FormulaireCompte nom="ajouter-mot-de-passe" bouton={T.ajouterMotDePasse} boutonEnvoi={T.envoiDuLien}>
              <p className="mb-2">{lierPonctuation(T.aideAjouterMotDePasse.replace("{email}", email))}</p>
              {relaisApple && <p className="mb-2 rounded-2xl border-2 border-encre bg-jaune-clair px-4 py-3">{lierPonctuation(T.avertissementRelaisApple)}</p>}
            </FormulaireCompte>
          )}
        </LigneConnexion>
        {fournisseurs.map(ligneFournisseur)}
      </ul>
    </PartieCompte>
  );
}
