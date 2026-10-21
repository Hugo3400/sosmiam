import { EcranReglagesReservations } from "~/composants/reservations-pro/EcranReglagesReservations";
import { utiliserModes } from "~/hooks/utiliser-modes";

export default function EcranReglagesReservationsPro() {
  const { lieuPro } = utiliserModes();
  if (!lieuPro) return null;
  return <EcranReglagesReservations lieu={lieuPro} />;
}
