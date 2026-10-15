import { useSyncExternalStore } from "react";

import { ecouter, lire } from "./monde.mjs";

export function utiliserSession() {
  const pret = useSyncExternalStore(ecouter, () => lire().sessionPrete, () => lire().sessionPrete);
  return { pret };
}
