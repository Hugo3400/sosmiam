import { Outlet } from "react-router";

import { Logo } from "~/composants/interface/Logo";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { TEXTES_CADRE_LEGAL_PAR_LANGUE } from "~/contenus/legal/cadre-legal";
import { TEXTES_EN_TETE_PAR_LANGUE } from "~/contenus/liens-en-tete";
import { utiliserAncresSansDiese } from "~/hooks/utiliser-ancres-sans-diese";
import { utiliserLienLangue } from "~/hooks/utiliser-lien-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Cadre des pages légales : simple, sans le menu du site, pour une lecture sans distraction.
 * Les liens sont des <a> classiques (rechargement complet), hérités de l'époque où ces pages étaient servies
 * derrière la page « Bientôt » ; des <Link> marcheraient aussi maintenant que tout le site est en ligne.
 */
export default function MiseEnPageLegale() {
  // Liens du sommaire sans « # » dans l'adresse
  utiliserAncresSansDiese();
  const T = utiliserTextes(TEXTES_CADRE_LEGAL_PAR_LANGUE);
  const { accueil } = utiliserTextes(TEXTES_EN_TETE_PAR_LANGUE);
  const lien = utiliserLienLangue();

  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienCanonique />
      <LienEvitement />
      <header className="border-b border-encre/5">
        <div className="mx-auto flex h-[72px] w-[min(1120px,100%-32px)] items-center justify-between gap-4">
          <a href={lien("/")} aria-label={accueil}><Logo /></a>
          <a href={lien("/")} className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
            <span aria-hidden="true">←</span> {T.retourSite}
          </a>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <PiedDePage />
    </div>
  );
}
