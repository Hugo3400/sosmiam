import type { EvenementLieuPublic } from "@sos-miam/commun/types/evenement";
import type { Lieu } from "@sos-miam/commun/types/lieu";

import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";

type LigneComparee = { lieu: Lieu; maintenant: Date; evenement?: EvenementLieuPublic | null };

export function estLigneLieuInchangee<P extends LigneComparee>(avant: P, apres: P): boolean {
  for (const cle in apres) if (cle !== "maintenant" && !Object.is(avant[cle], apres[cle])) return false;
  for (const cle in avant) if (!(cle in apres)) return false;
  if (avant.maintenant === apres.maintenant) return true;
  if (apres.evenement && avant.maintenant.getFullYear() !== apres.maintenant.getFullYear()) return false;
  return estOuvertMaintenant(avant.lieu, avant.maintenant) === estOuvertMaintenant(apres.lieu, apres.maintenant);
}
