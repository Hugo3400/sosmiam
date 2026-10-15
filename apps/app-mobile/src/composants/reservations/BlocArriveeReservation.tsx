import { Text, View } from "react-native";

import { PRESENCE_AVANT_CRENEAU_MS } from "@sos-miam/commun/regles/reservations";
import type { Reservation } from "@sos-miam/commun/types/reservation";
import { Bouton } from "~/composants/interface/Bouton";
import { CodeArriveeReservation } from "~/composants/reservations/CodeArriveeReservation";
import { CodeRapprochement } from "~/composants/visites/CodeRapprochement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  reservation: Reservation;
  presencePossible: boolean;
  client: { prenom: string; avatar: string };
  onSignalerPresence: () => void;
};

const HEURES_AVANT_PRESENCE = Math.round(PRESENCE_AVANT_CRENEAU_MS / 3_600_000);

function dessinerSurPlace(reservation: Reservation, client: Props["client"]) {
  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte-gras text-base text-encre">{lierPonctuation("📍 C'est noté, tu es sur place !")}</Text>
      {reservation.code ? (
        <CodeRapprochement code={reservation.code} prenom={client.prenom} avatar={client.avatar} legende="Donne ce code à l'équipe" taille="moyen" />
      ) : null}
      {reservation.statut === "acceptee" ? (
        <Text className="font-texte text-sm leading-5 text-encre">
          {lierPonctuation("Ta visite comptera dès que l'équipe touche « Venu ». Bon appétit !")}
        </Text>
      ) : null}
    </View>
  );
}

function dessinerPresencePossible(reservation: Reservation, onSignalerPresence: () => void) {
  return (
    <View className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-3">
      <Text className="font-texte text-[15px] leading-6 text-encre">
        {lierPonctuation("Tu arrives ? Une fois sur place, touche « Je\u00a0suis\u00a0là » : c'est ce qui fait compter ta visite.")}
      </Text>
      {reservation.code ? <CodeArriveeReservation code={reservation.code} /> : null}
      <Bouton
        libelle="📍 Je suis là"
        libelleLu={`Je suis là, chez ${reservation.lieu.nom}`}
        indice="Confirme que tu es sur place, grâce à ta position"
        onPress={onSignalerPresence}
      />
      <Text className="font-texte text-[12px] leading-4 text-gris">
        {lierPonctuation("Ta position sert juste à vérifier que tu es là : elle n'est jamais gardée.")}
      </Text>
    </View>
  );
}

function dessinerEnAttenteDuCreneau(reservation: Reservation) {
  return (
    <View className="gap-2.5 rounded-2xl border-2 border-ligne bg-creme p-3">
      {reservation.code ? <CodeArriveeReservation code={reservation.code} /> : null}
      <Text className="font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          `Le lieu t'attend ! « Je\u00a0suis\u00a0là » s'allume ${HEURES_AVANT_PRESENCE} h avant ton créneau : touche-le sur place pour que ta visite compte.`,
        )}
      </Text>
    </View>
  );
}

export function BlocArriveeReservation({ reservation, presencePossible, client, onSignalerPresence }: Props) {
  if (reservation.presenceLe) return dessinerSurPlace(reservation, client);
  if (presencePossible) return dessinerPresencePossible(reservation, onSignalerPresence);
  if (reservation.statut === "acceptee") return dessinerEnAttenteDuCreneau(reservation);
  return null;
}
