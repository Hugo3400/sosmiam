import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Réserver dans un lieu (provisoire). */
export default function EcranReserver() {
  return (
    <EcranProvisoire
      emoji="📅"
      titre="Réserver"
      texte="La réservation dans l'app arrive bientôt. En attendant, tu peux appeler le lieu ou passer directement."
    />
  );
}
