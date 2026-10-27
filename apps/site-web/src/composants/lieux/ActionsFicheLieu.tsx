import { BoutonPartager } from "~/composants/lieux/BoutonPartager";
import { CLASSE_ACTION, CLASSE_ACTION_PRINCIPALE } from "~/composants/lieux/classes-fiche-lieu";
import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/fiche-lieu";
import { creerLienItineraire } from "~/fonctions/lieux/creer-lien-itineraire";
import { creerLienTelephone } from "~/fonctions/lieux/creer-lien-telephone";
import { creerLienAppLieu } from "~/fonctions/liens-app/creer-lien-app-lieu";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { FichePublique } from "~/types/pro";

export function ActionsFicheLieu({ lieu, adresseFiche }: { lieu: FichePublique; adresseFiche: string }) {
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE).actions;
  return (
    <ul aria-label={T.etiquette} className="flex flex-wrap gap-2.5">
      <li className="hidden md:block">
        <a href={creerLienItineraire(lieu)} rel="noopener nofollow" className={CLASSE_ACTION_PRINCIPALE}>
          <IconeFiche nom="itineraire" />
          {T.itineraire}
          <span className="sr-only">{T.vers(lieu.nom)}</span>
        </a>
      </li>
      {lieu.telephone && (
        <li className="hidden md:block">
          <a href={creerLienTelephone(lieu.telephone)} className={CLASSE_ACTION}>
            <IconeFiche nom="appeler" />
            {T.appeler}
            <span className="sr-only">{T.appelerLe(lieu.telephone)}</span>
          </a>
        </li>
      )}
      {lieu.reservable ? (
        <li>
          <a href={creerLienAppLieu(lieu.id)} className={CLASSE_ACTION}>
            <IconeFiche nom="reserver" />
            {T.reserverDansApp}
          </a>
        </li>
      ) : lieu.telephone && (lieu.reservation === "conseillee" || lieu.reservation === "obligatoire") ? (
        <li>
          <a href={creerLienTelephone(lieu.telephone)} className={CLASSE_ACTION}>
            <IconeFiche nom="reserver" />
            {T.appelerPourReserver}
          </a>
        </li>
      ) : null}
      {lieu.siteWeb && (
        <li>
          <a href={lieu.siteWeb} rel="noopener nofollow" className={CLASSE_ACTION}>
            <IconeFiche nom="site" />
            {T.siteWeb}
          </a>
        </li>
      )}
      {lieu.instagram && (
        <li>
          <a href={`https://www.instagram.com/${lieu.instagram}/`} rel="noopener nofollow" className={CLASSE_ACTION}>
            <IconeFiche nom="instagram" />
            {T.instagram}
          </a>
        </li>
      )}
      <li className={lieu.telephone ? "empty:hidden" : "hidden md:block md:empty:hidden"}>
        <BoutonPartager titre={lieu.nom} adresse={adresseFiche} className={CLASSE_ACTION} />
      </li>
    </ul>
  );
}
