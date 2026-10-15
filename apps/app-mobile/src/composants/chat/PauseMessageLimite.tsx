import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Retire la bulle de l'écran (utiliserConversations().retirerEnPause) : elle n'est jamais partie. Absent : pas de « Retirer » */
  onRetirer?: () => void;
};

/**
 * Sous un de tes messages que le serveur a refusé parce que ton compte est limité (chat et discussion d'une sortie) : pas
 * une panne, donc pas de « Réessaie ». Touchée, la ligne ouvre Réglages › Décisions de la modération (le pourquoi, et de
 * quoi contester) ; « Retirer » efface la bulle du téléphone, pendant la limitation comme après.
 */
export function PauseMessageLimite({ onRetirer }: Props) {
  const router = useRouter();
  return (
    <View className="mt-0.5 flex-row flex-wrap items-center justify-end gap-x-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${REFUS_LIMITATION.bulle} Voir pourquoi`}
        accessibilityHint="Ouvre les décisions de la modération"
        onPress={() => {
          vibrerLegerement();
          router.push("/reglages/decisions-moderation");
        }}
        hitSlop={{ top: 4, bottom: 4 }}
        className="min-h-8 flex-row items-center gap-1 active:opacity-70"
      >
        <Ionicons name="pause-circle-outline" size={14} color={couleurs.encre} />
        <Text className="font-texte-semi text-[12px] text-encre">
          {lierPonctuation(REFUS_LIMITATION.bulle)} <Text className="underline">Voir pourquoi</Text>
        </Text>
      </Pressable>
      {onRetirer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retirer ce message"
          accessibilityHint="Il n'est jamais parti : il disparaît de ton téléphone"
          onPress={() => {
            vibrerLegerement();
            onRetirer();
            AccessibilityInfo.announceForAccessibility("Message retiré.");
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className="min-h-8 justify-center active:opacity-70"
        >
          <Text className="font-texte-semi text-[12px] text-gris underline">Retirer</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
