import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text } from "react-native";

import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

/**
 * Sous un de tes messages que le serveur a refusé parce que ton compte est limité (chat et discussion d'une sortie) : pas
 * une panne, donc pas de « Réessaie ». Touchée, la ligne ouvre Réglages › Décisions de la modération (le pourquoi, et de
 * quoi contester).
 */
export function PauseMessageLimite() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${REFUS_LIMITATION.bulle} Voir pourquoi`}
      accessibilityHint="Ouvre les décisions de la modération"
      onPress={() => {
        vibrerLegerement();
        router.push("/reglages/decisions-moderation");
      }}
      hitSlop={{ top: 4, bottom: 4 }}
      className="mt-0.5 min-h-8 flex-row items-center gap-1 active:opacity-70"
    >
      <Ionicons name="pause-circle-outline" size={14} color={couleurs.encre} />
      <Text className="font-texte-semi text-[12px] text-encre">
        {lierPonctuation(REFUS_LIMITATION.bulle)} <Text className="underline">Voir pourquoi</Text>
      </Text>
    </Pressable>
  );
}
