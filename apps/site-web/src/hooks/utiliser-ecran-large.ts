import { useSyncExternalStore } from "react";

const ECRAN_LARGE = "(min-width: 64rem)";

function suivreEcran(rappel: () => void) {
  const media = window.matchMedia(ECRAN_LARGE);
  media.addEventListener("change", rappel);
  return () => media.removeEventListener("change", rappel);
}

export function utiliserEcranLarge(): boolean {
  return useSyncExternalStore(suivreEcran, () => window.matchMedia(ECRAN_LARGE).matches, () => false);
}
