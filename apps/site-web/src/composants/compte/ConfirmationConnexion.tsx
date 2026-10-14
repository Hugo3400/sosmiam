import { Form } from "react-router";

import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FournisseurExterne } from "~/types/connexion-externe";

const noms = { apple: "Apple", google: "Google" } as const;
const autre = { apple: "google", google: "apple" } as const;

type Props = {
  /** « relier » : relier `fournisseur` ; « delier » : `fournisseur` a confirmé, on délie l'autre */
  intention: "relier" | "delier";
  fournisseur: FournisseurExterne;
};

/**
 * Dernière étape après Apple ou Google : « Relier ton compte Google ? » (ou « Délier… ? ») et un bouton. Leur retour
 * arrive sans le cookie de session : c'est ce bouton, envoyé depuis notre page, qui termine avec la session.
 */
export function ConfirmationConnexion({ intention, fournisseur }: Props) {
  const relier = intention === "relier";
  const nom = noms[fournisseur];
  const cible = relier ? nom : noms[autre[fournisseur]];
  const texte = relier
    ? `${nom} a confirmé que c'est bien toi. Tu pourras te connecter à SOS Miam avec ${nom}, en plus de tes autres façons. Ton adresse e-mail SOS Miam ne change pas.`
    : `${nom} a confirmé que c'est bien toi. Tu ne pourras plus te connecter avec ${cible} ; ${nom} restera ta façon de te connecter.`;
  return (
    <div className="mb-6 rounded-2xl border-2 border-encre bg-jaune-clair p-5">
      <h3 className="mb-2 text-xl font-extrabold">{relier ? `Relier ton compte ${nom} ?` : `Délier ton compte ${cible} ?`}</h3>
      <FormulaireCompte
        nom={relier ? "relier-externe" : "delier-externe"}
        bouton={relier ? `Oui, relier ${nom}` : `Oui, délier ${cible}`}
        boutonEnvoi={relier ? "On relie…" : "On délie…"}
        apres={
          <button type="submit" form="annuler-connexion" className="font-semibold underline decoration-2 underline-offset-2 hover:decoration-jaune">
            Non merci
          </button>
        }
      >
        <p className="mb-2">{lierPonctuation(texte)}</p>
      </FormulaireCompte>
      <Form method="post" id="annuler-connexion" className="hidden">
        <input type="hidden" name="formulaire" value="connexion-annuler" />
      </Form>
    </div>
  );
}
