import type { ReactNode } from "react";

import { EnTeteAmbassadeur } from "~/composants/ambassadeur/EnTeteAmbassadeur";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";

/**
 * Cadre de l'espace ambassadeur (https://ambassadeur.sosmiam.fr) : en-tête, contenu, pied de page avec les pages légales
 * de sosmiam.fr. Pas d'ancres sans « # » ici : /nouveau-mot-de-passe lit son jeton après le « # ».
 */
export function CadreAmbassadeur({ connecte, children }: { connecte: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienCanonique site={`https://${HOTE_AMBASSADEUR}`} />
      <LienEvitement />
      <EnTeteAmbassadeur connecte={connecte} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <PiedDePage espace="ambassadeur" accroche={"SOS Miam Ambassadeurs : un programme de passionnés, dès 18 ans."} />
    </div>
  );
}
