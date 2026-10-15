import { useMemo } from "react";

import type { MiamSafeLieu } from "@sos-miam/commun/types/miam-safe";
import { utiliserEtatMiamSafeLieu } from "~/hooks/utiliser-etat-miam-safe-lieu";

const RIEN: MiamSafeLieu = { engage: false, repere: false };

export function utiliserMiamSafeLieu(lieuId: number): MiamSafeLieu {
  const { lecture, engage, repere } = utiliserEtatMiamSafeLieu(lieuId);
  const lue = lecture === "lue";
  return useMemo(() => (lue ? { engage, repere } : RIEN), [lue, engage, repere]);
}
