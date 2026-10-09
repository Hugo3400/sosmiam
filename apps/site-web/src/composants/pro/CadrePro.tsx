import type { ReactNode } from "react";

import { EnTetePro } from "~/composants/pro/EnTetePro";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { HOTE_PRO } from "~/fonctions/hotes/choisir-redirection-hote";

type Props = {
  connecte: boolean;
  /** Le lieu des liens du menu (voir EnTetePro) */
  lieuMenu?: { id: number; gerant: boolean } | null;
  children: ReactNode;
};

/**
 * Cadre de l'espace pro (https://pro.sosmiam.fr) : en-tête « SOS Miam · pro », contenu, pied de page commun. À
 * l'impression (affichette), seul le contenu reste.
 */
export function CadrePro({ connecte, lieuMenu = null, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-creme print:block print:min-h-0 print:bg-white">
      <LienCanonique site={`https://${HOTE_PRO}`} />
      <LienEvitement />
      <EnTetePro connecte={connecte} lieuMenu={lieuMenu} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <div className="print:hidden">
        <PiedDePage espace="pro" accroche="SOS Miam pro : ta fiche, ton équipe, tes gourmands. Gratuit, pour toujours." />
      </div>
    </div>
  );
}
