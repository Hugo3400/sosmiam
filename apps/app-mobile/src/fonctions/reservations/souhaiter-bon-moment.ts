import type { TypeLieu } from "@sos-miam/commun/types/lieu";

export function souhaiterBonMoment(type: TypeLieu): string {
  return type === "resto" || type === "patisserie" ? "Bon appétit !" : "Profite bien !";
}
