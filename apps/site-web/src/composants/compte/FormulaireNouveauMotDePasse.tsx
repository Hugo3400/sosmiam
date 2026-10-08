import { useEffect, useState } from "react";
import { useActionData } from "react-router";

import { ChampTexte } from "~/composants/compte/ChampTexte";
import { FormulaireCompte, type ReponseFormulaire } from "~/composants/compte/FormulaireCompte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

/**
 * Nouveau mot de passe, avec le lien préparé par l'équipe (…/nouveau-mot-de-passe#jeton=…). Le jeton est lu après le « # »
 * (jamais envoyé au serveur dans l'adresse, donc jamais dans un journal), puis retiré de la barre d'adresse ; il part dans
 * le corps du formulaire. Sans JavaScript (ou si le lien est abîmé), un champ « Code reçu par mail » le remplace.
 */
export function FormulaireNouveauMotDePasse() {
  const reponse = useActionData<ReponseFormulaire>();
  const [jetonDuLien, setJetonDuLien] = useState<string | null>(null);

  useEffect(() => {
    const trouve = /(?:^#|&)jeton=([^&]+)/.exec(window.location.hash);
    if (!trouve) return;
    try {
      setJetonDuLien(decodeURIComponent(trouve[1]));
    } catch {
      return;
    }
    // Le jeton quitte la barre d'adresse et l'historique ; l'état de navigation de React Router est gardé
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
  }, []);

  // Code refusé (mal formé, déjà servi ou trop vieux) : on montre le champ, l'erreur dessous, et on oublie le code du
  // lien, pour qu'il ne remplace pas un nouveau lien collé dans le champ si le mot de passe est refusé ensuite
  const champCode = !jetonDuLien || Boolean(reponse?.erreurs?.jeton);
  useEffect(() => {
    if (reponse?.erreurs?.jeton) setJetonDuLien(null);
  }, [reponse]);

  return (
    <FormulaireCompte nom="nouveau-mot-de-passe" bouton="Enregistrer mon mot de passe" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <div className="grid gap-5">
        {champCode ? (
          <ChampTexte
            nom="jeton"
            libelle="Code reçu par mail"
            autoComplete="off"
            aide={lierPonctuation("C'est la suite de lettres et de chiffres après « jeton= » dans le lien qu'on t'a envoyé. Tu peux aussi coller le lien en entier.")}
          />
        ) : (
          <>
            <input type="hidden" name="jeton" value={jetonDuLien ?? ""} />
            <p className="rounded-2xl bg-jaune-clair px-4 py-3 font-medium"><span aria-hidden="true">✓ </span>Ton lien est bien reconnu.</p>
          </>
        )}
        <ChampTexte
          nom="motDePasse"
          libelle="Ton nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          aide={lierPonctuation("12 caractères au moins (16 si ce ne sont que des chiffres). Astuce : une petite phrase marche très bien.")}
        />
      </div>
    </FormulaireCompte>
  );
}
