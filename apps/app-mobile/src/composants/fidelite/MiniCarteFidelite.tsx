import { Pressable, Text, View } from "react-native";

import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  carte: CarteFidelite;
  onPress: () => void;
};

/** Une carte de fidélité en petit, pour le carrousel de l'onglet Scan : le lieu, ses tampons, et la récompense quand elle est prête. */
export function MiniCarteFidelite({ carte, onPress }: Props) {
  const prete = carte.pretes.length > 0;
  const libelle = prete
    ? `Carte de fidélité ${carte.lieu.nom} : ${carte.recompense} t'attend !`
    : `Carte de fidélité ${carte.lieu.nom} : ${carte.tampons} tampon${carte.tampons > 1 ? "s" : ""} sur ${carte.sur}, pour ${carte.recompense}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint="Ouvre la carte de fidélité"
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      style={{ width: 220 }}
      className={`gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${prete ? "bg-jaune" : "bg-white"}`}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{carte.lieu.emoji}</Text>
        <Text numberOfLines={1} className="flex-1 font-texte-gras text-[15px] text-encre">
          {carte.lieu.nom}
        </Text>
      </View>
      {/* Les tampons en petit : pleins pour ceux gagnés, en pointillé pour ceux qui restent */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row flex-wrap gap-1.5">
        {Array.from({ length: carte.sur }, (_, i) => (
          <View key={i} className={`h-4 w-4 rounded-full border-2 ${i < carte.tampons ? "border-encre bg-encre" : "border-dashed border-encre/40 bg-white"}`} />
        ))}
      </View>
      <Text numberOfLines={2} className="font-texte-semi text-[13px] leading-[18px] text-encre">
        {prete ? `🎁 ${carte.recompense} t'attend !` : `${carte.tampons}/${carte.sur} · ${carte.recompense}`}
      </Text>
    </Pressable>
  );
}
