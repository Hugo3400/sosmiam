import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Mes réservations (provisoire). */
export default function EcranMesReservations() {
  return (
    <EcranProvisoire
      emoji="📅"
      titre="Mes réservations"
      texte="Tes demandes de réservation et les réponses des lieux s'afficheront ici. Encore un peu de patience !"
    />
  );
}
