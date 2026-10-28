import { Pressable, Text, View } from "react-native";

import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import { MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { TEXTES_FIDELITE_PAR_LANGUE } from "~/contenus/textes-fidelite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  carte: CarteFidelite;
  onPress: () => void;
};

/** Une carte de fidélité en petit, pour le carrousel de l'onglet Scan : le lieu, ses tampons, et la récompense quand elle est prête. */
export function MiniCarteFidelite({ carte, onPress }: Props) {
  const T = utiliserTextes(TEXTES_FIDELITE_PAR_LANGUE);
  const prete = carte.pretes.length > 0;
  // Une récompense prête garde l'alcool de son gain ; sinon, celle vers laquelle on avance
  const alcool = prete ? carte.pretes[0].alcool === true : carte.recompenseAlcool;
  const libelle = `${
    prete ? T.miniPreteLu(carte.lieu.nom, carte.recompense) : T.miniProgressionLu(carte.lieu.nom, carte.tampons, carte.sur, carte.recompense)
  }${alcool ? ` ${T.messageSanitaireLu(MESSAGE_SANITAIRE_ALCOOL)}` : ""}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={T.ouvrirCarte}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      style={{ width: 220 }}
      className={`gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${prete ? "bg-jaune" : "bg-carte"}`}
    >
      <View className="flex-row items-center gap-2">
        <Text className="text-2xl">{carte.lieu.emoji}</Text>
        <Text numberOfLines={1} className={`flex-1 font-texte-gras text-[15px] ${prete ? "text-nuit" : "text-encre"}`}>
          {carte.lieu.nom}
        </Text>
      </View>
      {/* Les tampons en petit : pleins pour ceux gagnés, en pointillé pour ceux qui restent */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="flex-row flex-wrap gap-1.5">
        {Array.from({ length: carte.sur }, (_, i) => (
          <View key={i} className={`h-4 w-4 rounded-full border-2 ${i < carte.tampons ? (prete ? "border-nuit bg-nuit" : "border-encre bg-encre") : prete ? "border-dashed border-nuit/40 bg-white" : "border-dashed border-encre/40 bg-carte"}`} />
        ))}
      </View>
      <Text numberOfLines={2} className={`font-texte-semi text-[13px] leading-[18px] ${prete ? "text-nuit" : "text-encre"}`}>
        {prete ? T.recompenseAttend(carte.recompense) : `${carte.tampons}/${carte.sur} · ${carte.recompense}`}
      </Text>
      {alcool ? <MentionPrevention variante="courte" /> : null}
    </Pressable>
  );
}
