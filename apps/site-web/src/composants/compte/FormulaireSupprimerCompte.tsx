import { BoutonFournisseur } from "~/composants/compte/BoutonFournisseur";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte } from "~/composants/compte/FormulaireCompte";
import { TEXTES_CONNEXION_EXTERNE_PAR_LANGUE, type CodeConnexionExterne } from "~/contenus/connexion-externe";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_SUPPRESSION_COMPTE_PAR_LANGUE } from "~/contenus/suppression-compte";
import { construireAdresseDepart } from "~/fonctions/connexion-externe/construire-adresse-depart";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FournisseurExterne, PageDepart } from "~/types/connexion-externe";

type Props = {
  /**
   * Ce que l'avertissement met en avant : l'espace ambassadeur (par défaut), l'espace pro, ou un compte sans l'un ni l'autre
   * (« compte »)
   */
  espace?: "ambassadeur" | "pro" | "compte";
  /**
   * Compte sans mot de passe (créé avec Apple ou Google) : confirmé en se reconnectant avec le compte lié. « lies » : les
   * fournisseurs liés ET réglés sur le site ; « pret » : le fournisseur vient de confirmer (dernière étape) ; « depart » :
   * cette page ; « message » : celui d'un essai raté.
   */
  sansMotDePasse?: { lies: FournisseurExterne[]; pret: FournisseurExterne | null; depart: PageDepart; message: CodeConnexionExterne | null };
};

const noms = { apple: "Apple", google: "Google" } as const;

/** « Supprimer mon compte » dans « Mon compte » : un avertissement clair, puis le mot de passe pour confirmer. */
export function FormulaireSupprimerCompte({ espace = "ambassadeur", sansMotDePasse }: Props) {
  const T = utiliserTextes(TEXTES_SUPPRESSION_COMPTE_PAR_LANGUE);
  const { messages } = utiliserTextes(TEXTES_CONNEXION_EXTERNE_PAR_LANGUE);
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const avertissement = T.avertissements[espace](site.emailContact);
  const encadre = (
    <div className="mb-5 rounded-2xl border-2 border-rouge-texte bg-rose-alerte px-4 py-3 text-encre">
      <p className="font-semibold">{lierPonctuation(T.attention)}</p>
      <p className="mt-1">{lierPonctuation(avertissement)}</p>
    </div>
  );
  if (!sansMotDePasse) {
    return (
      <FormulaireCompte nom="suppression" bouton={T.bouton} boutonEnvoi={T.enCours} danger>
        {encadre}
        <ChampTexte nom="motDePasse" libelle={champs.motDePasseConfirmer} type="password" autoComplete="current-password" />
      </FormulaireCompte>
    );
  }
  const { lies, pret, depart, message } = sansMotDePasse;
  // Dernière étape : Apple ou Google vient de confirmer que c'est bien toi (jeton gardé côté serveur, 10 minutes)
  if (pret) {
    return (
      <FormulaireCompte nom="suppression-externe" bouton={T.boutonDefinitif} boutonEnvoi={T.enCours} danger>
        {encadre}
        <p className="mb-5 font-semibold">{lierPonctuation(T.confirme(noms[pret]))}</p>
      </FormulaireCompte>
    );
  }
  return (
    <div>
      {encadre}
      {message && <p role="status" className="mb-5 rounded-2xl border-2 border-encre bg-jaune-clair px-5 py-4 font-semibold">{lierPonctuation(messages[message])}</p>}
      {lies.length > 0 ? (
        <>
          <p className="mb-4">{lierPonctuation(T.reconnecteToi)}</p>
          <ul className="grid max-w-sm gap-3">
            {lies.map((fournisseur) => (
              <li key={fournisseur}>
                <BoutonFournisseur fournisseur={fournisseur} adresse={construireAdresseDepart(fournisseur, depart, null, "suppression")} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>{lierPonctuation(T.sansCompteLie(site.emailContact))}</p>
      )}
    </div>
  );
}
