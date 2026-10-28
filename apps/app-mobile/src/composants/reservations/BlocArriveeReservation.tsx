import { ActivityIndicator, Text, View } from "react-native";

import type { Langue } from "@sos-miam/commun/regles/langues";
import { PRESENCE_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { CodeArriveeReservation } from "~/composants/reservations/CodeArriveeReservation";
import { CodeRapprochement } from "~/composants/visites/CodeRapprochement";
import { ARRIVEE_RESERVATION_PAR_LANGUE } from "~/contenus/textes-reservations-client";
import { direChezLieuLangue } from "~/fonctions/langue/dire-chez-lieu-langue";
import { souhaiterBonMoment } from "~/fonctions/reservations/souhaiter-bon-moment";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import type { Palette } from "~/hooks/utiliser-theme";

type Props = {
  reservation: Reservation;
  presencePossible: boolean;
  presenceEnCours: string | null;
  client: { prenom: string; avatar: string };
  onSignalerPresence: () => void;
};

const HEURES_AVANT_PRESENCE = Math.round(PRESENCE_AVANT_CRENEAU_MS / 3_600_000);

type Textes = (typeof ARRIVEE_RESERVATION_PAR_LANGUE)["fr"];

function dessinerSurPlace(reservation: Reservation, client: Props["client"], T: Textes, langue: Langue) {
  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.surPlace)}</Text>
      {reservation.code ? (
        <CodeRapprochement code={reservation.code} prenom={client.prenom} avatar={client.avatar} legende={T.legendeCode} taille="moyen" />
      ) : null}
      {reservation.statut === "acceptee" ? (
        <Text className="font-texte text-sm leading-5 text-encre">
          {lierPonctuation(T.visiteComptera(souhaiterBonMoment(reservation.lieu.type, langue)))}
        </Text>
      ) : null}
    </View>
  );
}

function dessinerAttentePresence(texte: string, couleurs: Palette) {
  return (
    <View
      accessible
      accessibilityLabel={texte}
      accessibilityLiveRegion="polite"
      className="min-h-[60px] flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-carte px-6 py-2"
    >
      <ActivityIndicator color={couleurs.encre} />
      <Text className="font-texte-gras text-base text-encre">{texte}</Text>
    </View>
  );
}

function dessinerPresencePossible(reservation: Reservation, presenceEnCours: string | null, onSignalerPresence: () => void, couleurs: Palette, T: Textes, langue: Langue) {
  const chezLieu = direChezLieuLangue(reservation.lieu.nom, langue);
  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte text-[15px] leading-6 text-encre">
        {lierPonctuation(T.presencePossible)}
      </Text>
      {reservation.code ? <CodeArriveeReservation code={reservation.code} /> : null}
      {presenceEnCours ? (
        dessinerAttentePresence(presenceEnCours, couleurs)
      ) : (
        <Bouton libelle={T.bouton} libelleLu={T.boutonLu(chezLieu)} indice={T.boutonIndice(chezLieu)} onPress={onSignalerPresence} />
      )}
      <Text className="font-texte text-[12px] leading-4 text-gris">
        {lierPonctuation(T.position)}
      </Text>
    </View>
  );
}

function dessinerEnAttenteDuCreneau(reservation: Reservation, T: Textes) {
  return (
    <View className="gap-2.5 rounded-2xl border-2 border-ligne bg-creme p-3">
      {reservation.code ? <CodeArriveeReservation code={reservation.code} /> : null}
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(T.attenteCreneau(HEURES_AVANT_PRESENCE))}
      </Text>
    </View>
  );
}

export function BlocArriveeReservation({ reservation, presencePossible, presenceEnCours, client, onSignalerPresence }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(ARRIVEE_RESERVATION_PAR_LANGUE);
  if (reservation.presenceLe) return dessinerSurPlace(reservation, client, T, langue);
  if (presencePossible) return dessinerPresencePossible(reservation, presenceEnCours, onSignalerPresence, couleurs, T, langue);
  if (reservation.statut === "acceptee") return dessinerEnAttenteDuCreneau(reservation, T);
  return null;
}
