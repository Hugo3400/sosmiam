import { useSyncExternalStore } from "react";

import { ecouter, lire } from "./monde.mjs";

export function utiliserServices() {
  return useSyncExternalStore(ecouter, () => lire().services, () => lire().services);
}
