import type { Lieu, LieuApi, PositionLieu } from "@sos-miam/commun/types/lieu";

import { calculerDistance } from "~/fonctions/geo/calculer-distance";

/** Un prix moyen par gamme, quand le lieu ne l'a pas donné (il ne sert qu'aux tris et aux filtres) */
const PRIX_MOYEN_PAR_GAMME: Record<Lieu["prix"], number> = { "€": 12, "€€": 22, "€€€": 40 };

/**
 * Un lieu de l'API au format de l'app : la distance est calculée sur le téléphone depuis le point de départ (ta position ou
 * le centre de ta ville ; jamais envoyé au serveur). Sans point de départ ou sans position du lieu, elle est inconnue :
 * l'infini (jamais 0, qui le mettrait « à côté de toi »), que calculerKmLieu rend en null.
 */
export function convertirLieuApi(lieu: LieuApi, depart: PositionLieu | null): Lieu {
  return {
    ...lieu,
    km: depart && lieu.position ? calculerDistance(depart, lieu.position) : Number.POSITIVE_INFINITY,
    prixMoyen: lieu.prixMoyen ?? PRIX_MOYEN_PAR_GAMME[lieu.prix] ?? 22,
  };
}
