import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { site } from "~/contenus/legal/informations-legales";
import { ecrireAdresseMail } from "~/fonctions/texte/ecrire-adresse-mail";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export function LienSignalerInfo({ nom, lieuId, adresseFiche }: { nom: string; lieuId: number; adresseFiche: string }) {
  const T = TEXTES_FICHE_LIEU.signaler;
  const lien = ecrireAdresseMail(site.emailContact, { objet: T.objet(nom, lieuId), texte: T.texte(adresseFiche) });
  return (
    <a href={lien} className="self-start text-sm text-gris underline underline-offset-2 hover:text-encre focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre">
      {lierPonctuation(T.lien)}
    </a>
  );
}
