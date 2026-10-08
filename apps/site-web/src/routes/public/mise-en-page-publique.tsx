import { Outlet } from "react-router";

import { EnTete } from "~/composants/mise-en-page/EnTete";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { utiliserAncresSansDiese } from "~/hooks/utiliser-ancres-sans-diese";

/** Cadre de toutes les pages publiques : en-tête, contenu de la page, pied de page. */
export default function MiseEnPagePublique() {
  // Liens vers les sections sans « # » dans l'adresse
  utiliserAncresSansDiese();

  return (
    <>
      <LienEvitement />
      <EnTete />
      <main id="contenu" tabIndex={-1}>
        <Outlet />
      </main>
      <PiedDePage />
    </>
  );
}
