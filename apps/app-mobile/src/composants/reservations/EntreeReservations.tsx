import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ENTREE_MES_RESERVATIONS } from "~/contenus/textes-mes-reservations";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { resumerMesReservations } from "~/fonctions/reservations/resumer-mes-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

export function EntreeReservations() {
  const router = useRouter();
  const { reservations, lecturesReservations } = utiliserVisites();
  const { maintenantMs } = utiliserHorlogeMinute();
  const detail = lecturesReservations > 0 ? resumerMesReservations(reservations, maintenantMs) : ENTREE_MES_RESERVATIONS.pasEncoreLues;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ENTREE_MES_RESERVATIONS.titre}, ${detail}`}
      accessibilityHint={ENTREE_MES_RESERVATIONS.indice}
      onPress={() => {
        vibrerLegerement();
        router.push("/reservations");
      }}
      className="min-h-16 flex-row items-center gap-3 rounded-carte border-2 border-encre bg-white px-4 py-3 active:opacity-80"
    >
      <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune">
        <Text className="text-xl">📅</Text>
      </View>
      <View className="flex-1">
        <Text className="font-texte-gras text-base text-encre">{ENTREE_MES_RESERVATIONS.titre}</Text>
        <Text className="font-texte text-sm text-gris">{lierPonctuation(detail)}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={couleurs.gris} />
    </Pressable>
  );
}
