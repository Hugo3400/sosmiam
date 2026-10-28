import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { creerServicesApi } from "@sos-miam/commun/client-api/api/creer-services-api";

import { utiliserSession } from "~/hooks/utiliser-session";
import { ContexteServices, type ValeurServices } from "~/hooks/utiliser-services";
import { creerServicesIndisponibles } from "~/services/creer-services-indisponibles";

export function FournisseurServices({ children }: { children: ReactNode }) {
  const [sansCompte] = useState<ValeurServices>(() => ({ services: creerServicesIndisponibles() }));

  const { connecte, client: clientHttp, compte } = utiliserSession();
  const statutAmbassadeur = useRef(compte?.ambassadeur?.statut ?? null);
  useLayoutEffect(() => {
    statutAmbassadeur.current = compte?.ambassadeur?.statut ?? null;
  }, [compte]);
  const avecCompte = useMemo<ValeurServices>(
    () => ({ services: creerServicesApi(clientHttp, { lireStatutAmbassadeur: () => statutAmbassadeur.current }) }),
    [clientHttp],
  );

  return <ContexteServices.Provider value={connecte ? avecCompte : sansCompte}>{children}</ContexteServices.Provider>;
}
