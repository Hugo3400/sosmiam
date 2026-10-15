import { useLocalSearchParams, useRouter } from "expo-router";

import { Bouton } from "~/composants/interface/Bouton";
import { LieuEnAttente } from "~/composants/lieux/LieuEnAttente";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { EcranReserverTable } from "~/composants/reservations/EcranReserverTable";
import { SANS_COMPTE_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { TEXTES_RESERVER_TABLE } from "~/contenus/textes-reserver-table";
import { utiliserDemandeCompte } from "~/hooks/utiliser-demande-compte";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserLieuParId } from "~/hooks/utiliser-lieu-par-id";
import { utiliserServices } from "~/hooks/utiliser-services";

export default function EcranReserver() {
  const router = useRouter();
  const fermer = utiliserFermerPile();
  const demanderCompte = utiliserDemandeCompte();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { source } = utiliserServices();
  const recherche = utiliserLieuParId(id);

  if (source === "indisponible") {
    const { emoji, titre, texte, bouton, indice } = SANS_COMPTE_RESERVATIONS;
    return (
      <EcranReglage titre={recherche.lieu?.type === "sortie" ? TEXTES_RESERVER_TABLE.titreSortie : TEXTES_RESERVER_TABLE.titre} onRetour={fermer}>
        <CarteMessageReservations emoji={emoji} titre={titre} texte={texte} action={{ libelle: bouton, indice, onPress: () => demanderCompte("reserver") }} />
      </EcranReglage>
    );
  }
  if (recherche.lieu) return <EcranReserverTable lieu={recherche.lieu} />;
  if (recherche.enAttente || recherche.horsLigne) return <LieuEnAttente horsLigne={recherche.horsLigne} onReessayer={recherche.reessayer} />;
  return (
    <EcranReglage titre={TEXTES_RESERVER_TABLE.lieuIntrouvableTitre} sousTitre={TEXTES_RESERVER_TABLE.lieuIntrouvableTexte} onRetour={fermer}>
      <Bouton libelle={TEXTES_RESERVER_TABLE.voirExplorer} onPress={() => router.navigate("/explorer")} />
    </EcranReglage>
  );
}
