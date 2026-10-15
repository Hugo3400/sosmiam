import { useCallback, useState } from "react";

import type { ServiceCommunaute } from "@sos-miam/commun/client-api/contrat-communaute";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import { utiliserServiceCommunaute } from "~/hooks/utiliser-service-communaute";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

export type ResultatGesteCommunaute<T> = { ok: true; reponse: T } | { ok: false; erreur: ErreurService };

export function utiliserGesteCommunaute() {
  const service = utiliserServiceCommunaute();
  const actif = utiliserSourceSociale() === "compte";
  const [enCours, setEnCours] = useState<string | null>(null);

  const agir = useCallback(
    async <T extends object>(nom: string, appel: (s: ServiceCommunaute) => Promise<ReponseApi<T>>): Promise<ResultatGesteCommunaute<T>> => {
      if (!actif) return { ok: false, erreur: "service-indisponible" };
      setEnCours(nom);
      const reponse = await appel(service).catch(() => ({ ok: false, erreur: "hors-ligne" }) as const);
      setEnCours((actuel) => (actuel === nom ? null : actuel));
      return reponse.ok ? { ok: true, reponse } : { ok: false, erreur: reponse.erreur };
    },
    [service, actif],
  );

  return { enCours, agir };
}
