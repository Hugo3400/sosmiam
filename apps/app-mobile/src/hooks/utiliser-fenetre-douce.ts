import { useSyncExternalStore } from "react";

import { ecouterFenetreDouce, lireFenetreDouce, type FenetreDouce } from "~/services/fenetre-douce-ouverte";

export function utiliserFenetreDouce(): FenetreDouce | null {
  return useSyncExternalStore(ecouterFenetreDouce, lireFenetreDouce, lireFenetreDouce);
}
