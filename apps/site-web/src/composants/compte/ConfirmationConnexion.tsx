import { Form } from "react-router";

import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne } from "~/types/connexion-externe";
import type { MesConnexions } from "~/types/mes-connexions";

const noms = { apple: "Apple", google: "Google" } as const;
const autre = { apple: "google", google: "apple" } as const;

type Props = {
  /** « relier » : relier `fournisseur` ; « delier » : `fournisseur` a confirmé, on délie l'autre */
  intention: "relier" | "delier";
  fournisseur: FournisseurExterne;
  confirme: boolean;
  connexions: MesConnexions;
};

/**
 * Dernière étape après Apple ou Google : « Relier ton compte Google ? » (ou « Délier… ? ») et un bouton. Leur retour
 * arrive sans le cookie de session : c'est ce bouton, envoyé depuis notre page, qui termine avec la session.
 */
export function ConfirmationConnexion({ intention, fournisseur, confirme, connexions }: Props) {
  const relier = intention === "relier";
  const nom = noms[fournisseur];
  const autreFournisseur = autre[fournisseur];
  const nomAutre = noms[autreFournisseur];
  const cible = relier ? nom : nomAutre;
  const attendAutre = relier && !connexions.motDePasse && !confirme;
  const texte = !relier
    ? `${nom} a confirmé que c'est bien toi. Tu ne pourras plus te connecter avec ${cible} ; ${nom} restera ta façon de te connecter.`
    : connexions.motDePasse
      ? `${nom} a dit oui. Dernière vérification avant d'ajouter cette clé : ton mot de passe. Ensuite, tu pourras te connecter à SOS Miam avec ${nom}, en plus de tes autres façons. Ton adresse e-mail SOS Miam ne change pas.`
      : `${nom} et ${nomAutre} ont confirmé que c'est bien toi. Tu pourras te connecter à SOS Miam avec ${nom}, en plus de ${nomAutre}. Ton adresse e-mail SOS Miam ne change pas.`;
  const annuler = (
    <button type="submit" form="annuler-connexion" className="font-semibold underline decoration-2 underline-offset-2 hover:decoration-jaune">
      Non merci
    </button>
  );
  return (
    <div className="mb-6 rounded-2xl border-2 border-encre bg-jaune-clair p-5">
      <h3 className="mb-2 text-xl font-extrabold">{relier ? `Relier ton compte ${nom} ?` : `Délier ton compte ${cible} ?`}</h3>
      {attendAutre ? (
        <>
          <p className="mb-4">
            {lierPonctuation(connexions.actifs[autreFournisseur]
              ? `${nom} a dit oui. Ton compte n'a pas de mot de passe : pour vérifier que c'est bien toi, reconnecte-toi avec ${nomAutre}, ta clé actuelle. Après, un seul bouton et c'est relié !`
              : `${nom} a dit oui, mais ton compte n'a pas de mot de passe, et ${nomAutre} ne se lance pas ici pour confirmer. Ajoute d'abord un mot de passe (juste en dessous), puis reviens relier ${nom}.`)}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {connexions.actifs[autreFournisseur] && (
              <div className="w-full max-w-sm">
                <BoutonFournisseur fournisseur={autreFournisseur} adresse={construireAdresseDepart(autreFournisseur, connexions.depart, null, "confirmer-relier")} />
              </div>
            )}
            {annuler}
          </div>
        </>
      ) : (
        <FormulaireCompte
          nom={relier ? "relier-externe" : "delier-externe"}
          bouton={relier ? `Oui, relier ${nom}` : `Oui, délier ${cible}`}
          boutonEnvoi={relier ? "On relie…" : "On délie…"}
          apres={annuler}
        >
          <p className="mb-2">{lierPonctuation(texte)}</p>
          {relier && connexions.motDePasse && (
            <ChampTexte nom="motDePasse" libelle="Ton mot de passe, pour confirmer" type="password" autoComplete="current-password" />
          )}
        </FormulaireCompte>
      )}
      <Form method="post" id="annuler-connexion" className="hidden">
        <input type="hidden" name="formulaire" value="connexion-annuler" />
      </Form>
    </div>
  );
}
