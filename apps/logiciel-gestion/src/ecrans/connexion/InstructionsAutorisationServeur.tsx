import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { TEXTES_AUTORISATION } from "~/contenus/postes.ts";
import { copier } from "~/services/systeme.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";

const T = TEXTES_AUTORISATION.serveur;

export function InstructionsAutorisationServeur({ coffre, onContinuer }: { coffre: CoffreCle; onContinuer: () => void }) {
  const [copie, setCopie] = useState(false);
  const commande = `npm run gestion:autoriser -- ${coffre.clePublique} "${T.nomParDefaut}"`;

  return (
    <>
      <ol className="grid list-decimal gap-4 pl-5 text-[15px]">
        <li>
          {T.etape1}
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-ligne bg-creme p-3">
            <code className="flex-1 font-mono text-[12px] break-all">{commande}</code>
            <Bouton petit icone={copie ? Check : Copy} titre={T.copier} onClick={() => copier(commande).then(() => setCopie(true))} />
          </div>
        </li>
        <li>
          {T.etape2} <strong className="chiffres rounded bg-jaune-clair px-1.5 font-mono">{coffre.idPoste}</strong>.
        </li>
        <li>{T.etape3}</li>
      </ol>
      <Bouton variante="principal" className="mt-6 w-full" onClick={onContinuer}>{T.bouton}</Bouton>
    </>
  );
}
