import { useSyncExternalStore } from "react";

import { ecouter, lire } from "./monde.mjs";

export function utiliserSession() {
  const compte = useSyncExternalStore(ecouter, () => lire().compte ?? null, () => lire().compte ?? null);
  return { pret: true, compte };
}
