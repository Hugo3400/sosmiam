import { useSyncExternalStore } from "react";

import { ecouter, lire, monde } from "./monde.mjs";

export function usePathname() {
  return useSyncExternalStore(ecouter, () => lire().chemin, () => lire().chemin);
}

export const router = { push: (lien) => monde.pousses.push(lien) };
export const useRouter = () => router;
