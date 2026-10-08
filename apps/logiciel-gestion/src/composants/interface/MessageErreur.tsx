import { RotateCw, TriangleAlert } from "lucide-react";

import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import type { ErreurApi } from "~/services/client-gestion.ts";
import { Bouton } from "./Bouton.tsx";

/** Message d'erreur avec, si possible, un bouton pour réessayer. */
export function MessageErreur({ erreur, reessayer }: { erreur: ErreurApi | null; reessayer?: () => void }) {
  if (!erreur) return null;
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-carte border border-rouge-texte/30 bg-rose-alerte px-4 py-3 text-sm">
      <TriangleAlert className="size-5 shrink-0 text-rouge-texte" aria-hidden />
      <p className="flex-1 font-semibold text-rouge-texte">{expliquerErreur(erreur)}</p>
      {reessayer && <Bouton petit icone={RotateCw} onClick={reessayer}>Réessayer</Bouton>}
    </div>
  );
}
