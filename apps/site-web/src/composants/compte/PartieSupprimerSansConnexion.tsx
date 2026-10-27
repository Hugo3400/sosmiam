import { PartieCompte } from "~/composants/compte/PartieCompte";
import { Bouton } from "~/composants/interface/Bouton";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_MON_COMPTE_PAR_LANGUE } from "~/contenus/mon-compte";
import { ecrireAdresseMail } from "~/fonctions/texte/ecrire-adresse-mail";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * « Supprimer mon compte sans me connecter » (« Mon compte » de sosmiam.fr, sans connexion) : la marche à suivre par
 * mail, même sans l'app ni mot de passe. C'est la partie que demandent les stores (Google Play) : une adresse web où
 * demander la suppression de son compte et de ses données.
 */
export function PartieSupprimerSansConnexion() {
  const T = utiliserTextes(TEXTES_MON_COMPTE_PAR_LANGUE);
  const S = T.sansConnexion;
  return (
    <PartieCompte id="supprimer-sans-connexion" titre={S.titre}>
      <p className="mb-4">
        {lierPonctuation(S.intro)}
      </p>
      <ol className="mb-5 grid list-decimal gap-2 pl-6">
        <li>
          {lierPonctuation(S.ecrisA)}
          <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>
          {lierPonctuation(S.depuisAdresse)}
        </li>
        <li>{lierPonctuation(S.objet(T.mailSuppression.objet))}</li>
        <li>{lierPonctuation(S.onEfface(T.delaiReponse))}</li>
      </ol>
      <Bouton href={ecrireAdresseMail(site.emailContact, T.mailSuppression)} variante="blanc">{T.mesDonnees.mailToutPret}</Bouton>
      <p className="mt-5 text-gris">
        {lierPonctuation(S.adresseImpossible)}
      </p>
      <p className="mt-3 text-gris">{lierPonctuation(T.resteApresSuppression)}</p>
    </PartieCompte>
  );
}
