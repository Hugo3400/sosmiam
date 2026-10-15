import { useSyncExternalStore } from "react";

import { ecouter, lire } from "./monde.mjs";

export function utiliserProfil() {
  const profil = useSyncExternalStore(ecouter, () => lire().profil, () => lire().profil);
  const invite = useSyncExternalStore(ecouter, () => lire().invite, () => lire().invite);
  return { profil, invite };
}
