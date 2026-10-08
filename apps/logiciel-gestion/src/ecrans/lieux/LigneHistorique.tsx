import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/** Une ligne de l'historique d'un lieu, qui ouvre l'écran concerné quand on clique dessus. */
export function LigneHistorique({ onClick, children }: { onClick?: () => void; children: ReactNode }) {
  return (
    <li>
      <button type="button" disabled={!onClick} onClick={onClick} className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-[13px] enabled:hover:bg-creme">
        <span className="min-w-0 flex-1">{children}</span>
        {onClick && <ChevronRight className="size-4 shrink-0 text-gris" aria-hidden />}
      </button>
    </li>
  );
}
