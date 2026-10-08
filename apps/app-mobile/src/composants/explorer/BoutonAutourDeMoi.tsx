import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Tri par distance en cours (les plus proches d'abord) */
  actif: boolean;
  /** Position en cours de lecture */
  recherche: boolean;
  onPress: () => void;
};

/** Pastille « Autour de moi » posée sur la carte : trie par distance ; encre et jaune quand c'est actif, petite roue pendant qu'on lit la position. */
export function BoutonAutourDeMoi({ actif, recherche, onPress }: Props) {
  // Le changement d'état est dit au lecteur d'écran (pas au premier affichage)
  const precedent = useRef(actif);
  useEffect(() => {
    if (precedent.current === actif) return;
    precedent.current = actif;
    if (Platform.OS === "web") return;
    AccessibilityInfo.announceForAccessibility(actif ? "Autour de moi : les lieux les plus proches d'abord" : "Autour de moi désactivé");
  }, [actif]);

  const libelle = recherche ? "On te cherche…" : "Autour de moi";
  return (
    <View className={`relative self-start ${recherche ? "opacity-80" : ""}`}>
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <Pressable
        accessibilityRole="button"
        // Le libellé dit la recherche en cours : l'état « busy » serait lu en anglais sur iPhone, on le garde pour Android
        accessibilityLabel={libelle}
        accessibilityHint={
          actif
            ? "Les lieux sont triés du plus proche au plus loin. Touche encore pour oublier ta position"
            : "Trie les lieux du plus proche au plus loin. Ta position n'est lue que quand tu touches, gardée le temps de l'écran et jamais enregistrée"
        }
        accessibilityState={{ selected: actif, disabled: recherche, ...(Platform.OS === "ios" ? {} : { busy: recherche }) }}
        disabled={recherche}
        onPress={() => {
          vibrerLegerement();
          onPress();
        }}
        className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 border-encre px-4 active:translate-x-0.5 active:translate-y-0.5
          ${actif ? "bg-encre" : "bg-white"}`}
      >
        {recherche ? (
          <ActivityIndicator size="small" color={actif ? couleurs.jaune : couleurs.encre} />
        ) : (
          <Ionicons name={actif ? "navigate" : "navigate-outline"} size={18} color={actif ? couleurs.jaune : couleurs.encre} />
        )}
        <Text className={`font-texte-gras text-[15px] ${actif ? "text-jaune" : "text-encre"}`}>{libelle}</Text>
      </Pressable>
    </View>
  );
}
