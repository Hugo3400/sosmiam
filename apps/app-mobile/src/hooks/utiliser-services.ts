import { createContext, useContext } from "react";

import type { Services } from "@sos-miam/commun/client-api/services";

export type ValeurServices = { services: Services };

export const ContexteServices = createContext<ValeurServices | null>(null);

export function utiliserServices(): Services {
  const valeur = useContext(ContexteServices);
  if (!valeur) throw new Error("utiliserServices doit être appelé sous <FournisseurServices>.");
  return valeur.services;
}
