import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  icone: "arrow-undo" | "create-outline";
  titre: string;
  detail: string;
  libelleFermer: string;
  onFermer: () => void;
};

export function BandeauReponseChat({ icone, titre, detail, libelleFermer, onFermer }: Props) {
  const couleurs = utiliserCouleurs();
  return (
    <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-ligne bg-carte pl-3">
      <View className="w-1 self-stretch rounded-full bg-jaune" style={{ marginVertical: 8 }} />
      <Ionicons name={icone} size={18} color={couleurs.encre} />
      <View accessible accessibilityLabel={`${titre}. ${detail}`} className="flex-1 py-1.5">
        <Text numberOfLines={1} className="font-texte-gras text-[13px] text-encre">
          {titre}
        </Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {lierPonctuation(detail)}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={libelleFermer}
        onPress={() => {
          vibrerLegerement();
          onFermer();
        }}
        className="h-11 w-11 items-center justify-center active:opacity-60"
      >
        <Ionicons name="close" size={20} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
