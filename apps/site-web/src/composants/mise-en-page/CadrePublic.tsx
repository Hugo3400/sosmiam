import type { ReactNode } from "react";

import { BandeauDeveloppement } from "~/composants/mise-en-page/BandeauDeveloppement";
import { EnTete } from "~/composants/mise-en-page/EnTete";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { utiliserAncresSansDiese } from "~/hooks/utiliser-ancres-sans-diese";

/**
 * Cadre des pages publiques de sosmiam.fr : bandeau « app en développement », en-tête, contenu, pied de page. Servi par
 * routes/public/mise-en-page-publique.tsx, et par « Mon compte » sur sosmiam.fr (routes/compte/mise-en-page-mon-compte.tsx).
 */
export function CadrePublic({ children }: { children: ReactNode }) {
  // Liens vers les sections sans « # » dans l'adresse
  utiliserAncresSansDiese();

  return (
    <>
      <LienCanonique />
      <LienEvitement />
      <BandeauDeveloppement />
      <EnTete />
      <main id="contenu" tabIndex={-1}>
        {children}
      </main>
      <PiedDePage />
    </>
  );
}
