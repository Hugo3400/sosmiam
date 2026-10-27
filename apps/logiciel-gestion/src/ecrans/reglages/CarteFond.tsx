import { BellRing } from "lucide-react";

import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { TEXTES_FOND } from "~/contenus/fond.ts";
import type { utiliserFond } from "~/hooks/utiliser-fond.ts";
import { peutResterEnFond } from "~/services/systeme.ts";

export type EtatFond = ReturnType<typeof utiliserFond>;

const T = TEXTES_FOND.carte;

export function CarteFond({ fond }: { fond: EtatFond }) {
  const raison = !peutResterEnFond() ? T.navigateur : !fond.possible ? T.passage : null;
  return (
    <Carte titre={<span className="flex items-center gap-2"><BellRing className="size-4" aria-hidden /> {T.titre}</span>}>
      <div className="grid gap-3 text-sm">
        <CaseACocher libelle={T.case} aide={T.aide} coche={fond.actif} desactive={raison !== null} onChange={fond.changer} />
        {raison ? (
          <p className="rounded-xl bg-creme px-3 py-2">{raison}</p>
        ) : fond.actif && (
          <p className={`rounded-xl px-3 py-2 ${fond.erreur ? "bg-rose-alerte text-rouge-texte" : "bg-vert-clair text-vert"}`}>
            {fond.erreur ? TEXTES_FOND.erreurJeton : fond.jeton ? T.actif : T.enAttente}
          </p>
        )}
        <p className="text-[13px] text-gris">{T.securite}</p>
      </div>
    </Carte>
  );
}
