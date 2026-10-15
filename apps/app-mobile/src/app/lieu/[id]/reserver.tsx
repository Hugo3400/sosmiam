import { useLocalSearchParams } from "expo-router";

import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";
import { EcranReserverTable } from "~/composants/reservations/EcranReserverTable";
import { trouverLieuExempleReservation } from "~/contenus/reserver-table-exemples";
import { DEMO_POSSIBLE } from "~/services/demo/demo-visites-active";

export default function EcranReserver() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!DEMO_POSSIBLE) {
    return (
      <EcranProvisoire
        emoji="📅"
        titre="Réserver"
        texte="La réservation dans l'app arrive bientôt. En attendant, tu peux appeler le lieu ou passer directement."
      />
    );
  }
  return <EcranReserverTable lieu={trouverLieuExempleReservation(id)} />;
}
