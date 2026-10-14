import type { LieuEnvoyeApi } from "@sos-miam/commun/types/messagerie";
import type { Recommandation } from "@sos-miam/commun/types/potes";

/** Un lieu envoyé entre potes tel que l'API le rend (un message « lieu »), au format des écrans ; « » : compte supprimé */
export function convertirLieuEnvoyeApi(l: LieuEnvoyeApi): Recommandation {
  return { id: l.id, de: l.de?.id ?? "", a: l.a?.id ?? "", lieuId: l.lieuId, ...(l.mot ? { mot: l.mot } : {}), date: l.date, vue: l.vu };
}
