import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { MotifRefusReservation, ReservationPro } from "@sos-miam/commun/types/reservation";
import { Annonce } from "~/composants/interface/Annonce";
import { CarteReservationPro } from "~/composants/pro/CarteReservationPro";
import { FeuilleRefusReservation } from "~/composants/pro/FeuilleRefusReservation";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteMessageReservations } from "~/composants/reservations/CarteMessageReservations";
import { SectionReservations } from "~/composants/reservations/SectionReservations";
import { TEXTES_RESERVATIONS_PRO } from "~/contenus/textes-reservations-pro";
import { nommerClientReservation } from "~/fonctions/reservations/nommer-client-reservation";
import { rangerReservationsPro } from "~/fonctions/reservations/ranger-reservations-pro";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserReservationsPro } from "~/hooks/utiliser-reservations-pro";
import couleurs from "~/theme/couleurs";

type ReponseGeste = ReponseApi<{ reservation: ReservationPro }>;

export default function EcranReservationsPro() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { lieuPro } = utiliserModes();
  const { maintenantMs, recaler } = utiliserHorlogeMinute();
  const reservations = utiliserReservationsPro(lieuPro?.id ?? null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [aRefuser, setARefuser] = useState<ReservationPro | null>(null);
  const [refusOuvert, setRefusOuvert] = useState(false);

  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/pro/comptoir"));

  async function suivre(reservation: ReservationPro, geste: Promise<ReponseGeste>, modele: string) {
    const reponse = await geste;
    recaler();
    if (reponse.ok) {
      annoncer(remplirModele(modele, { nom: nommerClientReservation(reservation), code: reponse.reservation.code ?? "" }));
      return;
    }
    const message = decrireEchecVisite(reponse.erreur, reponse.details, lieuPro?.nom);
    annoncer(`${message.titre}. ${message.texte}`);
  }

  const dessinerCarte = (reservation: ReservationPro) => (
    <CarteReservationPro
      key={reservation.id}
      reservation={reservation}
      maintenantMs={maintenantMs}
      enCours={reservations.enCours === reservation.id}
      onAccepter={() => void suivre(reservation, reservations.accepter(reservation.id), TEXTES_RESERVATIONS_PRO.annonceAcceptee)}
      onRefuser={() => {
        setARefuser(reservation);
        setRefusOuvert(true);
      }}
      onMarquerArrivee={(venu) =>
        void suivre(reservation, reservations.marquerArrivee(reservation.id, venu), venu ? TEXTES_RESERVATIONS_PRO.annonceVenu : TEXTES_RESERVATIONS_PRO.annonceAbsent)
      }
    />
  );

  const contenu = () => {
    const { lecture } = reservations;
    if (!lieuPro) return <CarteMessageReservations emoji="🧑‍🍳" titre={TEXTES_RESERVATIONS_PRO.sansLieuTitre} texte={TEXTES_RESERVATIONS_PRO.sansLieuTexte} />;
    if (lecture.etat === "attente") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={TEXTES_RESERVATIONS_PRO.chargement} />
        </View>
      );
    }
    if (lecture.etat === "erreur") {
      const message = decrireEchecVisite(lecture.erreur, undefined, lieuPro?.nom);
      const action = { libelle: TEXTES_RESERVATIONS_PRO.reessayer, indice: TEXTES_RESERVATIONS_PRO.indiceReessayer, onPress: () => void reservations.relire() };
      return <CarteMessageReservations emoji={MESSAGES_SERVICE[lecture.erreur].emoji} titre={message.titre} texte={message.texte} action={action} />;
    }
    const { aRepondre, aujourdhui, aVenir } = rangerReservationsPro(lecture.reservations, maintenantMs);
    if (aRepondre.length + aujourdhui.length + aVenir.length === 0) {
      return <CarteMessageReservations emoji="📅" titre={TEXTES_RESERVATIONS_PRO.videTitre} texte={TEXTES_RESERVATIONS_PRO.videTexte} />;
    }
    return (
      <>
        {aRepondre.length > 0 ? (
          <SectionReservations titre={TEXTES_RESERVATIONS_PRO.aRepondre} nombre={aRepondre.length}>
            {aRepondre.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
        {aujourdhui.length > 0 ? (
          <SectionReservations titre={TEXTES_RESERVATIONS_PRO.aujourdhui} nombre={aujourdhui.length}>
            {aujourdhui.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
        {aVenir.length > 0 ? (
          <SectionReservations titre={TEXTES_RESERVATIONS_PRO.aVenir} nombre={aVenir.length}>
            {aVenir.map(dessinerCarte)}
          </SectionReservations>
        ) : null}
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage titre={TEXTES_RESERVATIONS_PRO.titre} sousTitre={lieuPro ? `${lieuPro.emoji} ${lieuPro.nom} · ${TEXTES_RESERVATIONS_PRO.sousTitre}` : undefined} onRetour={revenir}>
        <View className="gap-6">{contenu()}</View>

        <FeuilleRefusReservation
          visible={refusOuvert}
          titre={remplirModele(TEXTES_RESERVATIONS_PRO.refusTitre, { nom: aRefuser ? nommerClientReservation(aRefuser) : "ce client" })}
          onConfirmer={(motif: MotifRefusReservation) => {
            setRefusOuvert(false);
            if (aRefuser) void suivre(aRefuser, reservations.refuser(aRefuser.id, motif), TEXTES_RESERVATIONS_PRO.annonceRefusee);
          }}
          onFermer={() => setRefusOuvert(false)}
        />
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </View>
  );
}
