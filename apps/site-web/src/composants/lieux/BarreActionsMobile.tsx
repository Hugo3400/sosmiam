import { BoutonPartager } from "~/composants/lieux/BoutonPartager";
import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { creerLienItineraire } from "~/fonctions/lieux/creer-lien-itineraire";
import { creerLienTelephone } from "~/fonctions/lieux/creer-lien-telephone";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { FichePublique } from "~/types/pro";

type Props = { lieu: FichePublique; adresseFiche: string; lienApp: string };

const CLASSE_CASE =
  "flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-encre px-1 py-2 text-[13px] font-bold no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre";

export function BarreActionsMobile({ lieu, adresseFiche, lienApp }: Props) {
  const T = TEXTES_FICHE_LIEU.actions;
  return (
    <nav aria-label={TEXTES_FICHE_LIEU.barreMobile} className="sticky bottom-0 z-30 mt-10 border-t-2 border-encre bg-white px-3 pt-2.5 pb-[max(18px,env(safe-area-inset-bottom))] md:hidden">
      <ul className="grid auto-cols-fr grid-flow-col gap-2">
        <li>
          <a href={creerLienItineraire(lieu)} rel="noopener nofollow" className={`${CLASSE_CASE} bg-jaune text-encre`}>
            <IconeFiche nom="itineraire" className="h-[22px] w-[22px]" />
            {T.itineraire}
            <span className="sr-only">{T.vers(lieu.nom)}</span>
          </a>
        </li>
        {lieu.telephone ? (
          <li>
            <a href={creerLienTelephone(lieu.telephone)} className={`${CLASSE_CASE} bg-white text-encre`}>
              <IconeFiche nom="appeler" className="h-[22px] w-[22px]" />
              {T.appeler}
              <span className="sr-only">{T.appelerLe(lieu.telephone)}</span>
            </a>
          </li>
        ) : (
          <li className="empty:hidden">
            <BoutonPartager titre={lieu.nom} adresse={adresseFiche} className={`${CLASSE_CASE} bg-white text-encre`} classeIcone="h-[22px] w-[22px]" />
          </li>
        )}
        <li>
          <a href={lienApp} className={`${CLASSE_CASE} bg-encre text-jaune`}>
            <IconeFiche nom="telephone" className="h-[22px] w-[22px]" />
            {lierPonctuation(T.ouvrirApp)}
          </a>
        </li>
      </ul>
    </nav>
  );
}
