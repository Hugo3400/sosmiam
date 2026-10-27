import type { LieuCiteActus, ReponseLieuActus } from "../../../../../packages/commun/src/types/actus.ts";

export function trierReponsesLieux(reponses: readonly ReponseLieuActus[], lieux: readonly Pick<LieuCiteActus, "id">[]): ReponseLieuActus[] {
  const rang = (reponse: ReponseLieuActus) => {
    const place = lieux.findIndex((lieu) => lieu.id === reponse.lieuId);
    return place < 0 ? lieux.length : place;
  };
  return [...reponses].sort((a, b) => rang(a) - rang(b));
}
