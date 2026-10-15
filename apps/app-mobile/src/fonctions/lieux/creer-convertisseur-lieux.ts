import type { Lieu, LieuApi, PositionLieu } from "@sos-miam/commun/types/lieu";

import { convertirLieuApi } from "~/fonctions/lieux/convertir-lieu-api";

export function creerConvertisseurLieux(depart: PositionLieu | null): (lieu: LieuApi) => Lieu {
  const convertis = new WeakMap<LieuApi, Lieu>();
  return (lieu) => {
    const deja = convertis.get(lieu);
    if (deja) return deja;
    const converti = convertirLieuApi(lieu, depart);
    convertis.set(lieu, converti);
    return converti;
  };
}
