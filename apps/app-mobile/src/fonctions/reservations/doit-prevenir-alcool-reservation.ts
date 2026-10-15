import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import type { TypeLieu } from "@sos-miam/commun/types/lieu";

export function doitPrevenirAlcoolReservation(type: TypeLieu, petitMot: string | null): boolean {
  return type === "bar" || parleDAlcool(petitMot);
}
