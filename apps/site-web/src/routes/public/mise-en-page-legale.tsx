import { Outlet } from "react-router";

import { Logo } from "~/composants/interface/Logo";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePageLegal } from "~/composants/mise-en-page/PiedDePageLegal";
import { utiliserAncresSansDiese } from "~/hooks/utiliser-ancres-sans-diese";

/**
 * Cadre des pages légales : simple, sans le menu du site, car ces pages sont aussi servies derrière
 * la page « Bientôt » de sosmiam.fr. Les liens sont des <a> classiques (rechargement complet) pour la même raison.
 */
export default function MiseEnPageLegale() {
  // Liens du sommaire sans « # » dans l'adresse
  utiliserAncresSansDiese();

  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienEvitement />
      <header className="border-b border-encre/5">
        <div className="mx-auto flex h-[72px] w-[min(1120px,100%-32px)] items-center justify-between gap-4">
          <a href="/" aria-label="SOS Miam, accueil"><Logo /></a>
          <a href="/" className="font-semibold underline decoration-jaune decoration-[3px] underline-offset-4 hover:decoration-encre">
            <span aria-hidden="true">←</span> Retour au site
          </a>
        </div>
      </header>
      <main id="contenu" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <PiedDePageLegal />
    </div>
  );
}
