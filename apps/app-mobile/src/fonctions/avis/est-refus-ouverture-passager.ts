import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";

import type { RefusOuvertureAvis } from "~/fonctions/avis/choisir-refus-ouverture-avis";

const PASSAGERES: readonly ErreurService[] = ["hors-ligne", "erreur-serveur", "trop-de-demandes", "service-indisponible"];

export function estRefusOuverturePassager(refus: Pick<RefusOuvertureAvis, "erreur">, visiteLue: boolean): boolean {
  return !visiteLue && PASSAGERES.includes(refus.erreur);
}
