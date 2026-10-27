import { useEffect } from "react";
import { useActionData } from "react-router";

import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_MOT_DE_PASSE_PAR_LANGUE } from "~/contenus/mot-de-passe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJetonDuLien } from "~/hooks/utiliser-jeton-du-lien";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Nouveau mot de passe, avec le lien reçu par mail (…/nouveau-mot-de-passe#jeton=…), demandé avec « Mot de passe oublié »
 * ou préparé par l'équipe. Le jeton est lu après le « # » (utiliserJetonDuLien) et part dans le corps du formulaire. Sans
 * JavaScript (ou si le lien est abîmé), un champ « Code reçu par mail » le remplace.
 */
export function FormulaireNouveauMotDePasse() {
  const T = utiliserTextes(TEXTES_MOT_DE_PASSE_PAR_LANGUE).nouveau;
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const reponse = useActionData<ReponseFormulaire>();
  const [jetonDuLien, setJetonDuLien] = utiliserJetonDuLien();

  // Code refusé (mal formé, déjà servi ou trop vieux) : on montre le champ, l'erreur dessous, et on oublie le code du
  // lien, pour qu'il ne remplace pas un nouveau lien collé dans le champ si le mot de passe est refusé ensuite
  const champCode = !jetonDuLien || Boolean(reponse?.erreurs?.jeton);
  useEffect(() => {
    if (reponse?.erreurs?.jeton) setJetonDuLien(null);
  }, [reponse]);

  return (
    <FormulaireCompte nom="nouveau-mot-de-passe" bouton={T.bouton} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <div className="grid gap-5">
        {champCode ? (
          <ChampTexte
            nom="jeton"
            libelle={champs.codeRecu}
            autoComplete="off"
            aide={lierPonctuation(champs.aideCode)}
          />
        ) : (
          <>
            <input type="hidden" name="jeton" value={jetonDuLien ?? ""} />
            <p className="rounded-2xl bg-jaune-clair px-4 py-3 font-medium"><span aria-hidden="true">✓ </span>{T.lienReconnu}</p>
          </>
        )}
        <ChampTexte
          nom="motDePasse"
          libelle={champs.nouveauMotDePasse}
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation(champs.aideMotDePasse)}
        />
      </div>
    </FormulaireCompte>
  );
}
