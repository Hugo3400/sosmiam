import { useSyncExternalStore } from "react";

import { changerReglagesDemo, ecouterReglagesDemo, lireReglagesDemo } from "~/services/demo/reglages-demo-vivants";
import type { ReglagesDemo } from "~/services/demo/types-demo";

/** Les réglages des Coulisses de la démo (vraie position, réponses automatiques, avis en accéléré, pépin), et de quoi les changer. */
export function utiliserReglagesDemo(): { reglages: ReglagesDemo; changer: (p: Partial<ReglagesDemo>) => Promise<void> } {
  const reglages = useSyncExternalStore(ecouterReglagesDemo, lireReglagesDemo, lireReglagesDemo);
  return { reglages, changer: changerReglagesDemo };
}
