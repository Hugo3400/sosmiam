import { Outlet } from "react-router";

import { BandeauDeveloppement } from "~/composants/mise-en-page/BandeauDeveloppement";
import { EnTete } from "~/composants/mise-en-page/EnTete";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { utiliserAncresSansDiese } from "~/hooks/utiliser-ancres-sans-diese";

/** Cadre de toutes les pages publiques : bandeau « app en développement », en-tête, contenu, pied de page. */
export default function MiseEnPagePublique() {
  // Liens vers les sections sans « # » dans l'adresse
  utiliserAncresSansDiese();

  return (
    <>
      <LienCanonique />
      <LienEvitement />
      <BandeauDeveloppement />
      <EnTete />
      <main id="contenu" tabIndex={-1}>
        <Outlet />
      </main>
      <PiedDePage />
    </>
  );
}
