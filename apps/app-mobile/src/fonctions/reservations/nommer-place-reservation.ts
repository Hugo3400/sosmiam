import type { TypeLieu } from "@sos-miam/commun/types/lieu";

export function nommerPlaceReservation(type: TypeLieu): "table" | "place" {
  return type === "sortie" ? "place" : "table";
}
