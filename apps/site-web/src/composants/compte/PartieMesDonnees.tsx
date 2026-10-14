import { PartieCompte } from "~/composants/compte/PartieCompte";
import { site } from "~/contenus/legal/informations-legales";
import { DELAI_REPONSE, droitsRgpd, mailCopie } from "~/contenus/mon-compte";
import { ecrireAdresseMail } from "~/fonctions/texte/ecrire-adresse-mail";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
  const lienContact = <a href={`mailto:${site.emailContact}`} className={classeLien}>{site.emailContact}</a>;
  return (
    <PartieCompte id="mes-donnees" titre="Mes données">
      <div className="grid gap-6">
        <div>
          <h3 className="mb-2 text-lg font-extrabold">Ce qu'on garde</h3>
          <p>
            {lierPonctuation("Ton e-mail, ton prénom ou ton pseudo, et ce que tu fais sur SOS Miam. Jamais ton mot de passe en clair, et zéro revente. Le détail (quoi, pourquoi, combien de temps) est dans notre ")}
            <a href="/confidentialite" className={classeLien}>politique de confidentialité</a>.
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">Avoir une copie de mes données</h3>
          <p>
            {lierPonctuation("Écris-nous depuis l'adresse de ton compte, avec l'objet « Copie de mes données ». On te l'envoie ")}
            {lierPonctuation(`${DELAI_REPONSE}.`)}
          </p>
          <p className="mt-3">
            <a href={ecrireAdresseMail(site.emailContact, mailCopie)} className={classeLien}>Écrire le mail tout prêt</a>
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">Tout supprimer</h3>
          <p>
            {connecte
              ? lierPonctuation("Le bouton « Supprimer mon compte », juste au-dessus : ton compte part tout de suite, avec ce qui y est rattaché.")
              : lierPonctuation("Connecte-toi et utilise « Supprimer mon compte », ou fais-le dans l'app (« Mon compte », dans tes réglages), ou écris-nous : la marche à suivre est juste au-dessus.")}
            {lierPonctuation(" Inscrit à la newsletter ? Le lien « Me désinscrire » en bas de chaque mail suffit.")}
          </p>
        </div>
        <div>
          <h3 className="mb-2 text-lg font-extrabold">Mes droits, en clair</h3>
          <ul className="grid gap-2">
            {droitsRgpd.map(({ droit, explication }) => (
              <li key={droit} className="flex gap-2">
                <span aria-hidden="true">🍽️</span>
                <span><strong>{droit}</strong>{lierPonctuation(` : ${explication}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4">
            {lierPonctuation("Pour tout ça, un mail à ")}{lienContact}
            {lierPonctuation(` suffit. On te répond ${DELAI_REPONSE} (deux mois de plus seulement pour une demande complexe, et on te prévient). Pour la CNIL, c'est `)}
            <a href="https://www.cnil.fr/fr/plaintes" className={classeLien}>par ici</a>
            {lierPonctuation(" ; et tous les détails sont dans ")}
            <a href="/confidentialite#droits" className={classeLien}>tes droits</a>.
          </p>
        </div>
      </div>
    </PartieCompte>
  );
}
