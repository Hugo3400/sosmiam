import type { ReactNode } from "react";

import { EnTeteAmbassadeur } from "~/composants/ambassadeur/EnTeteAmbassadeur";
import { LienCanonique } from "~/composants/mise-en-page/LienCanonique";
import { LienEvitement } from "~/composants/mise-en-page/LienEvitement";
import { PiedDePage } from "~/composants/mise-en-page/PiedDePage";
import { TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE } from "~/contenus/espace-ambassadeur";
import { HOTE_AMBASSADEUR } from "~/fonctions/hotes/choisir-redirection-hote";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * Cadre de l'espace ambassadeur (https://ambassadeur.sosmiam.fr) : en-tête, contenu, pied de page avec les pages légales
 * de sosmiam.fr. Pas d'ancres sans « # » ici : /nouveau-mot-de-passe lit son jeton après le « # ».
 */
export function CadreAmbassadeur({ connecte, children }: { connecte: boolean; children: ReactNode }) {
  const T = utiliserTextes(TEXTES_ESPACE_AMBASSADEUR_PAR_LANGUE).cadre;
  return (
    <div className="flex min-h-screen flex-col bg-creme">
      <LienCanonique site={`https://${HOTE_AMBASSADEUR}`} />
      <LienEvitement />
      <EnTeteAmbassadeur connecte={connecte} />
      <main id="contenu" tabIndex={-1} className="flex-1">
        {children}
      </main>
      <PiedDePage espace="ambassadeur" accroche={T.accroche} />
    </div>
  );
}
