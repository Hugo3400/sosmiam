import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";

import { BULLE_EN_PAUSE_PAR_LANGUE, REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const couleurs = utiliserCouleurs();
  const T_PAUSE = utiliserTextes(BULLE_EN_PAUSE_PAR_LANGUE);
  const T_REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const router = useRouter();
  return (
    <View className="mt-0.5 flex-row flex-wrap items-center justify-end gap-x-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${T_REFUS.bulle} ${T_PAUSE.voirPourquoi}`}
        accessibilityHint={T_PAUSE.indiceVoirPourquoi}
        onPress={() => {
          vibrerLegerement();
          router.push("/reglages/decisions-moderation");
        }}
        hitSlop={{ top: 4, bottom: 4 }}
        className="min-h-8 flex-row items-center gap-1 active:opacity-70"
      >
        <Ionicons name="pause-circle-outline" size={14} color={couleurs.encre} />
        <Text className="font-texte-semi text-[12px] text-encre">
          {lierPonctuation(T_REFUS.bulle)} <Text className="underline">{T_PAUSE.voirPourquoi}</Text>
        </Text>
      </Pressable>
      {onRetirer ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T_PAUSE.retirerLu}
          accessibilityHint={T_PAUSE.indiceRetirer}
          onPress={() => {
            vibrerLegerement();
            onRetirer();
            AccessibilityInfo.announceForAccessibility(T_PAUSE.retire);
          }}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          className="min-h-8 justify-center active:opacity-70"
        >
          <Text className="font-texte-semi text-[12px] text-gris underline">{T_PAUSE.retirer}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
