import { useEffect } from "react";
import { useActionData, useSubmit } from "react-router";

import { BandeauVerificationEmail } from "~/composants/compte/BandeauVerificationEmail";
import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserJetonDuLien } from "~/hooks/utiliser-jeton-du-lien";

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
        {lierPonctuation("On vérifie ton lien…")}
      </p>
    );
  }

  const lienRefuse = Boolean(reponse?.erreurs?.jeton);
  return (
    <div className="grid gap-6">
      <FormulaireCompte nom={nom} bouton="Confirmer mon adresse" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
        <ChampTexte
          nom="jeton"
          libelle="Code reçu par mail"
          autoComplete="off"
          aide={lierPonctuation("C'est la suite de lettres et de chiffres après « jeton= » dans le lien qu'on t'a envoyé. Tu peux aussi coller le lien en entier.")}
        />
      </FormulaireCompte>
      {connecte ? (
        <BandeauVerificationEmail
          texte={lienRefuse ? "Ton lien ne marche plus ? On t'en envoie un nouveau, à l'adresse de ton compte." : "Pas reçu de lien ? On t'en envoie un nouveau, à l'adresse de ton compte."}
          bouton="Renvoyer un lien"
        />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-encre/40 px-4 py-4">
          <p>{lierPonctuation("Ton lien ne marche plus ? Connecte-toi : depuis ton espace, tu pourras t'en faire renvoyer un.")}</p>
          <Bouton vers="/connexion" variante="blanc" petit className="mt-3">Me connecter</Bouton>
        </div>
      )}
    </div>
  );
}
