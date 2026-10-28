import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE } from "~/contenus/textes-inscription-profil";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * La case « newsletter » de l'inscription (soft opt-in de la CNIL) : bien visible, cochée par défaut, et on la décoche d'un
 * appui. Lue seulement à la création du compte.
 */
export function CaseNewsletter({ cochee, onChanger }: { cochee: boolean; onChanger: (cochee: boolean) => void }) {
  const couleurs = utiliserCouleurs();
  const texte = utiliserTextes(TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE).newsletter;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: cochee }}
      accessibilityLabel={texte}
      onPress={() => onChanger(!cochee)}
      className="flex-row items-start gap-3 rounded-carte border-2 border-encre bg-carte p-4 active:opacity-80"
    >
      <View className={`mt-0.5 h-7 w-7 items-center justify-center rounded-lg border-2 border-encre ${cochee ? "bg-jaune" : "bg-carte"}`}>
        {cochee ? <Ionicons name="checkmark" size={18} color={couleurs.nuit} /> : null}
      </View>
      <Text className="flex-1 font-texte text-[15px] leading-[21px] text-encre">{lierPonctuation(texte)}</Text>
    </Pressable>
  );
}
