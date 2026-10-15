import { useLocalSearchParams, useRouter } from "expo-router";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { Bouton } from "~/composants/interface/Bouton";
import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";
import { LieuEnAttente } from "~/composants/lieux/LieuEnAttente";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { EcranReserverTable } from "~/composants/reservations/EcranReserverTable";
import { TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserServices } from "~/hooks/utiliser-services";

export default function EcranReserver() {
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { source } = utiliserServices();
  const recherche = utiliserLieuParId(id);

  if (source === "indisponible") {
    const message = MESSAGES_SERVICE["service-indisponible"];
    return <EcranProvisoire emoji={message.emoji} titre={message.titre} texte="La réservation dans l'app s'allume avec les comptes. En attendant, tu peux appeler le lieu ou passer directement." />;
  }
  if (recherche.lieu) return <EcranReserverTable lieu={recherche.lieu} />;
  if (recherche.enAttente || recherche.horsLigne) return <LieuEnAttente horsLigne={recherche.horsLigne} onReessayer={recherche.reessayer} />;
  return (
    <EcranReglage titre={TEXTES_RESERVER_TABLE.lieuIntrouvableTitre} sousTitre={TEXTES_RESERVER_TABLE.lieuIntrouvableTexte} onRetour={fermer}>
      <Bouton libelle={TEXTES_RESERVER_TABLE.voirExplorer} onPress={() => router.navigate("/explorer")} />
    </EcranReglage>
  );
}
