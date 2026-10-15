import { useCallback, useSyncExternalStore } from "react";

import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserSession } from "~/hooks/utiliser-session";
import {
  ecrireCleAlerteMiamSafe, lireAlerteGardeeMiamSafe, suivreAlerteGardeeMiamSafe, type AlerteGardeeMiamSafe,
} from "~/services/memoire-alertes-miam-safe";

export type AlerteGardeeLieu = { cle: string; alerte: AlerteGardeeMiamSafe | null };

export function utiliserAlerteGardeeMiamSafe(lieuId: number): AlerteGardeeLieu {
  const { source } = utiliserServices();
  const { compte } = utiliserSession();
  const cle = ecrireCleAlerteMiamSafe(source, compte?.email ?? "", lieuId);
  const suivre = useCallback((rappel: () => void) => suivreAlerteGardeeMiamSafe(cle, rappel), [cle]);
  const lire = useCallback(() => lireAlerteGardeeMiamSafe(cle), [cle]);
  const alerte = useSyncExternalStore(suivre, lire, lire);
  return { cle, alerte };
}
