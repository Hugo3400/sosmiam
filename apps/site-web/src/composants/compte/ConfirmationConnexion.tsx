import { Form } from "react-router";

import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_MES_CONNEXIONS_PAR_LANGUE } from "~/contenus/mes-connexions";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
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
  const T = utiliserTextes(TEXTES_MES_CONNEXIONS_PAR_LANGUE);
  const C = T.confirmation;
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const relier = intention === "relier";
  const nom = noms[fournisseur];
  const autreFournisseur = autre[fournisseur];
  const nomAutre = noms[autreFournisseur];
  const cible = relier ? nom : nomAutre;
  const attendAutre = relier && !connexions.motDePasse && !confirme;
  const texte = !relier ? C.delier(nom, cible) : connexions.motDePasse ? C.relierAvecMotDePasse(nom) : C.relierConfirme(nom, nomAutre);
  const annuler = (
    <button type="submit" form="annuler-connexion" className="font-semibold underline decoration-2 underline-offset-2 hover:decoration-jaune">
      {C.nonMerci}
    </button>
  );
  return (
    <div className="mb-6 rounded-2xl border-2 border-encre bg-jaune-clair p-5">
      <h3 className="mb-2 text-xl font-extrabold">{relier ? C.titreRelier(nom) : C.titreDelier(cible)}</h3>
      {attendAutre ? (
        <>
          <p className="mb-4">
            {lierPonctuation(connexions.actifs[autreFournisseur] ? C.attendAutre(nom, nomAutre) : C.autreIndisponible(nom, nomAutre))}
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
          bouton={relier ? C.ouiRelier(nom) : C.ouiDelier(cible)}
          boutonEnvoi={relier ? T.enCoursRelier : T.enCoursDelier}
          apres={annuler}
        >
          <p className="mb-2">{lierPonctuation(texte)}</p>
          {relier && connexions.motDePasse && (
            <ChampTexte nom="motDePasse" libelle={champs.motDePasseConfirmer} type="password" autoComplete="current-password" />
          )}
        </FormulaireCompte>
      )}
      <Form method="post" id="annuler-connexion" className="hidden">
        <input type="hidden" name="formulaire" value="connexion-annuler" />
      </Form>
    </div>
  );
}
