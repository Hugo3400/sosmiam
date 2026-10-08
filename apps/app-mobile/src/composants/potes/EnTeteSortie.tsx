import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { ParticipantsSortie } from "~/composants/potes/ParticipantsSortie";
import couleurs from "~/theme/couleurs";

type Props = {
  sortie: Sortie;
  /** Jour et heure, déjà écrits : « Vendredi 10 octobre à 20h30 » */
  quand: string;
  participants: Pote[];
  organisateur: Pote | null;
  onRetour: () => void;
};

/** Le haut d'une sortie : retour, emoji et titre, jour et heure, puis les participants et qui organise. */
export function EnTeteSortie({ sortie, quand, participants, organisateur, onRetour }: Props) {
  return (
    <View className="flex-row items-start gap-3 px-5 pb-3 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        onPress={onRetour}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>
      <View className="flex-1 gap-1.5">
        {/* L'emoji reste à l'écran mais n'est pas lu : le titre suffit */}
        <Text accessibilityRole="header" accessibilityLabel={sortie.titre} numberOfLines={2} className="font-titre text-[26px] leading-[30px] text-encre">
          {sortie.emoji} {sortie.titre}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Ionicons name="calendar-outline" size={16} color={couleurs.gris} accessibilityElementsHidden importantForAccessibility="no" />
          <Text className="flex-1 font-texte-semi text-[15px] text-encre">{quand}</Text>
        </View>
        <ParticipantsSortie participants={participants} organisateur={organisateur} />
      </View>
    </View>
  );
}
