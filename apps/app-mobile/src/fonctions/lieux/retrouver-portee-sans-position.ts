import type { PorteeExplorer } from "~/contenus/portee-explorer";

export function retrouverPorteeSansPosition(
  porteeChoisie: PorteeExplorer | null,
  avantAutour: { portee: PorteeExplorer | null } | null,
  sansPointDeDepart: boolean,
): PorteeExplorer | null {
  const remise = porteeChoisie === "proche" && avantAutour ? avantAutour.portee : porteeChoisie;
  return remise === "proche" && sansPointDeDepart ? null : remise;
}
