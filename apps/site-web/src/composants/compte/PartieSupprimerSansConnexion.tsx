import { PartieCompte } from "~/composants/compte/PartieCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { site } from "~/contenus/legal/informations-legales";
import { DELAI_REPONSE, mailSuppression, RESTE_APRES_SUPPRESSION } from "~/contenus/mon-compte";
import { ecrireAdresseMail } from "~/fonctions/texte/ecrire-adresse-mail";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * « Supprimer mon compte sans me connecter » (« Mon compte » de sosmiam.fr, sans connexion) : la marche à suivre par
 * mail, même sans l'app ni mot de passe. C'est la partie que demandent les stores (Google Play) : une adresse web où
 * demander la suppression de son compte et de ses données.
 */
export function PartieSupprimerSansConnexion() {
  return (
    <PartieCompte id="supprimer-sans-connexion" titre="Supprimer mon compte sans me connecter">
      <p className="mb-4">
        {lierPonctuation("Plus l'app, pas de mot de passe, ou juste pas envie de te connecter ? Pas de souci, un mail suffit :")}
      </p>
      <ol className="mb-5 grid list-decimal gap-2 pl-6">
        <li>
          {lierPonctuation("Écris à ")}
          <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>
          {lierPonctuation(" depuis l'adresse e-mail de ton compte.")}
        </li>
        <li>{lierPonctuation(`Objet : « ${mailSuppression.objet} ». Dans le mail, dis simplement que tu veux supprimer ton compte et tes données.`)}</li>
        <li>{lierPonctuation(`On efface ton compte et tout ce qui y est rattaché, et on te répond ${DELAI_REPONSE}.`)}</li>
      </ol>
      <Bouton href={ecrireAdresseMail(site.emailContact, mailSuppression)} variante="blanc">Écrire le mail tout prêt</Bouton>
      <p className="mt-5 text-gris">
        {lierPonctuation("Tu ne peux pas écrire depuis cette adresse (adresse masquée par Apple, boîte fermée…) ? Écris-nous quand même en la donnant : on vérifie juste que c'est bien toi avant d'effacer quoi que ce soit.")}
      </p>
      <p className="mt-3 text-gris">{lierPonctuation(RESTE_APRES_SUPPRESSION)}</p>
    </PartieCompte>
  );
}
