import type { ServiceAnnoncesApp } from "@sos-miam/commun/client-api/contrat-annonces-app";

import { ANNONCES_EXEMPLES } from "~/contenus/annonces-exemples";

export function creerAnnoncesAppDemo(): ServiceAnnoncesApp {
  return {
    lister: async () => ({ ok: true, annonces: [...ANNONCES_EXEMPLES] }),
  };
}
