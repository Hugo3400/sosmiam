import { Outlet } from "react-router";

import { CadrePublic } from "~/composants/mise-en-page/CadrePublic";

/** Cadre de toutes les pages publiques : bandeau « app en développement », en-tête, contenu, pied de page. */
export default function MiseEnPagePublique() {
  return (
    <CadrePublic>
      <Outlet />
    </CadrePublic>
  );
}
