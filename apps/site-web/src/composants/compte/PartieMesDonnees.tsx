import { PartieCompte } from "~/composants/compte/PartieCompte";
import { site } from "~/contenus/legal/informations-legales";
import { TEXTES_MON_COMPTE_PAR_LANGUE } from "~/contenus/mon-compte";
import { ecrireAdresseMail } from "~/fonctions/texte/ecrire-adresse-mail";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const classeLien = "font-semibold text-encre underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

type Props = {
  /** Connecté : la suppression est juste au-dessus, dans la page ; sinon, elle passe par la connexion, l'app ou un mail */
  connecte: boolean;
};

/**
 * « Mes données » dans le « Mon compte » de sosmiam.fr : ce qu'on garde, comment en avoir une copie (par mail : l'API n'a
 * pas d'export en libre-service, l'équipe le fait depuis le logiciel de gestion), comment tout supprimer, et tes droits.
 */
export function PartieMesDonnees({ connecte }: Props) {
  const T = utiliserTextes(TEXTES_MON_COMPTE_PAR_LANGUE);
  const D = T.mesDonnees;
  const lien = utiliserLienLangue();
  const lienContact = <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>;
  return (
    <PartieCompte id="mes-donnees" titre={D.titre}>
      <div className="grid gap-6">
        <div>
          <h3 className="mb-2 text-lg font-extrabold">{D.ceQuOnGarde}</h3>
          <p>
            {lierPonctuation(D.garde)}
            <a href={lien("/confidentialite")} className={classeLien}>{D.politique}</a>.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">{D.copie}</h3>
          <p>
            {lierPonctuation(D.copieTexte)}
            {lierPonctuation(`${T.delaiReponse}.`)}
          </p>
          <p className="mt-3">
            <a href={ecrireAdresseMail(site.emailContact, T.mailCopie)} className={classeLien}>{D.mailToutPret}</a>
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">{D.toutSupprimer}</h3>
          <p>
            {lierPonctuation(connecte ? D.supprimerConnecte : D.supprimerVisiteur)}
            {lierPonctuation(D.newsletter)}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">{D.mesDroits}</h3>
          <ul className="grid gap-2">
            {T.droitsRgpd.map(({ droit, explication }) => (
              <li key={droit} className="flex gap-2">
                <span aria-hidden="true">🍽️</span>
                <span><strong>{droit}</strong>{lierPonctuation(`${D.separateurDroit}${explication}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            {lierPonctuation(D.pourToutCa)}{lienContact}
            {lierPonctuation(D.reponse(T.delaiReponse))}
            <a href="https://www.cnil.fr/fr/plaintes" className={classeLien}>{D.parIci}</a>
            {lierPonctuation(D.details)}
            <a href={lien("/confidentialite#droits")} className={classeLien}>{D.tesDroits}</a>.
          </p>
        </div>
      </div>
    </PartieCompte>
  );
}
