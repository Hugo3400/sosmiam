import { useEffect } from "react";
import { useActionData, useSubmit } from "react-router";

import { BandeauVerificationEmail } from "~/composants/compte/BandeauVerificationEmail";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE } from "~/contenus/formulaire-compte";
import { TEXTES_VERIFICATION_EMAIL_PAR_LANGUE } from "~/contenus/verification-email";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJetonDuLien } from "~/hooks/utiliser-jeton-du-lien";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Connecté : un lien qui ne marche plus peut être renvoyé d'ici */
  connecte: boolean;
};

const nom = "verifier-email";

/**
 * Confirmation de l'e-mail (action de routes/compte/verifier-email.tsx). Avec JavaScript, le jeton du lien (après le
 * « # », utiliserJetonDuLien) part tout seul dès l'ouverture de la page. Sans JavaScript, ou si le lien ne marche plus :
 * un champ « Code reçu par mail », et de quoi recevoir un nouveau lien.
 */
export function FormulaireVerificationEmail({ connecte }: Props) {
  const T = utiliserTextes(TEXTES_VERIFICATION_EMAIL_PAR_LANGUE);
  const { champs } = utiliserTextes(TEXTES_FORMULAIRE_COMPTE_PAR_LANGUE);
  const donnees = useActionData<ReponseFormulaire>();
  const reponse = donnees?.formulaire === nom ? donnees : undefined;
  const [jetonDuLien] = utiliserJetonDuLien();
  const submit = useSubmit();

  useEffect(() => {
    // Adresse donnée sans « # » : sinon React Router, qui a encore l'ancienne adresse en tête, remettrait le jeton dans la barre
    if (jetonDuLien) submit({ formulaire: nom, jeton: jetonDuLien }, { method: "post", action: "/verifier-email", replace: true });
  }, [jetonDuLien]);

  if (jetonDuLien && !reponse) {
    return (
      <p role="status" className="rounded-carte border-2 border-encre bg-white px-6 py-10 text-center text-lg font-semibold shadow-brut">
        {lierPonctuation(T.onVerifie)}
      </p>
    );
  }

  const lienRefuse = Boolean(reponse?.erreurs?.jeton);
  return (
    <div className="grid gap-6">
      <FormulaireCompte nom={nom} bouton={T.bouton} className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <ChampTexte
          nom="jeton"
          libelle={champs.codeRecu}
          autoComplete="off"
          aide={lierPonctuation(champs.aideCode)}
        />
      </FormulaireCompte>
      {connecte ? (
        <BandeauVerificationEmail
          texte={lienRefuse ? T.lienRefuse : T.pasRecu}
          bouton={T.renvoyerUnLien}
        />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-encre/40 px-4 py-4">
          <p>{lierPonctuation(T.connecteToi)}</p>
          <Bouton vers="/connexion" variante="blanc" petit className="mt-3">{T.meConnecter}</Bouton>
        </div>
      )}
    </div>
  );
}
