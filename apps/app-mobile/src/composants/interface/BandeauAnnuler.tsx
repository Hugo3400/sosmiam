import { useEffect } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { BandeauAnnulerAffiche } from "~/hooks/utiliser-bandeau-annuler";
import { utiliserLecteurEcran } from "~/hooks/utiliser-lecteur-ecran";

type Props = {
  /** utiliserBandeauAnnuler ; null : rien à montrer */
  bandeau: BandeauAnnulerAffiche | null;
  /** Distance depuis le bas de l'écran (au-dessus de la barre d'onglets) */
  bas: number;
  onFermer: () => void;
};

// Le temps d'atteindre « Annuler » ; plus long avec un lecteur d'écran, qui doit d'abord y aller
const DUREE = 6_000;
const DUREE_LECTEUR_ECRAN = 15_000;

/**
 * Petit bandeau sombre en bas de l'écran après un retrait (« Lieu retiré »), avec « Annuler » pour tout remettre, comme Gmail
 * ou Instagram : retirer ne demande pas de confirmation, mais se rattrape. Il s'efface tout seul ; lu par VoiceOver et TalkBack.
 */
export function BandeauAnnuler({ bandeau, bas, onFermer }: Props) {
  const lecteurEcran = utiliserLecteurEcran();

  useEffect(() => {
    if (!bandeau) return;
    const texte = `${bandeau.texte}. Tu peux annuler.`;
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
    else AccessibilityInfo.announceForAccessibility(texte);
    const minuterie = setTimeout(onFermer, lecteurEcran ? DUREE_LECTEUR_ECRAN : DUREE);
    return () => clearTimeout(minuterie);
  }, [bandeau, lecteurEcran, onFermer]);

  if (!bandeau) return null;
  return (
    <Animated.View key={bandeau.numero} entering={FadeInDown.duration(200)} exiting={FadeOutDown.duration(200)} style={{ bottom: bas }} className="absolute inset-x-4">
      <View className="min-h-14 flex-row items-center gap-3 rounded-2xl bg-encre py-2 pl-4 pr-2">
        <Text className="flex-1 font-texte-semi text-[15px] text-white">{bandeau.texte}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          accessibilityHint="Remet ce que tu viens de retirer"
          onPress={() => {
            vibrerLegerement();
            bandeau.annuler();
            onFermer();
            AccessibilityInfo.announceForAccessibility("C'est remis");
          }}
          className="min-h-11 items-center justify-center rounded-full px-4 active:opacity-70"
        >
          <Text className="font-texte-gras text-[15px] text-jaune">Annuler</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
