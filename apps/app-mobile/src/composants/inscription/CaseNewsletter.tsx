import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

const TEXTE = "Oui, envoie-moi la newsletter de SOS Miam : nouveaux lieux, nouvelles villes et BIG SOS près de chez moi. Désinscription en un clic, sans rancune 🍟";

/**
 * La case « newsletter » de l'inscription (soft opt-in de la CNIL) : bien visible, cochée par défaut, et on la décoche d'un
 * appui. Lue seulement à la création du compte.
 */
export function CaseNewsletter({ cochee, onChanger }: { cochee: boolean; onChanger: (cochee: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: cochee }}
      accessibilityLabel={TEXTE}
      onPress={() => onChanger(!cochee)}
      className="flex-row items-start gap-3 rounded-carte border-2 border-encre bg-white p-4 active:opacity-80"
    >
      <View className={`mt-0.5 h-7 w-7 items-center justify-center rounded-lg border-2 border-encre ${cochee ? "bg-jaune" : "bg-white"}`}>
        {cochee ? <Ionicons name="checkmark" size={18} color={couleurs.encre} /> : null}
      </View>
      <Text className="flex-1 font-texte text-[15px] leading-[21px] text-encre">{lierPonctuation(TEXTE)}</Text>
    </Pressable>
  );
}
