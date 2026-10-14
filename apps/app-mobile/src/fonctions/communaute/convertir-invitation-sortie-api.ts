import type { InvitationSortieApi } from "@sos-miam/commun/types/sorties";
import type { InvitationSortie } from "~/hooks/utiliser-communaute";

/** « Tu viens ? » tel que l'API le rend, au format des écrans (les personnes par leur identifiant public) */
export function convertirInvitationSortieApi(i: InvitationSortieApi): InvitationSortie {
  return {
    id: i.id,
    titre: i.titre,
    emoji: i.emoji,
    quand: i.quand,
    organisateur: i.organisateur?.id ?? null,
    invitePar: i.invitePar?.id ?? null,
    participants: i.participants,
    date: i.date,
  };
}
