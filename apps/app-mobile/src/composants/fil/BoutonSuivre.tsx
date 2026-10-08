import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  suivi: boolean;
  /** Auteur lu par VoiceOver : « @lea.mange » ou le nom du lieu */
  nom: string;
  onPress: () => void;
};

/** « Suivre » (jaune) ou « Suivi » (discret, avec une coche) à côté du nom de l'auteur, sur la fiche posée sur la vidéo. */
export function BoutonSuivre({ suivi, nom, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Suivre ${nom}`}
      accessibilityState={{ selected: suivi }}
      accessibilityHint={suivi ? "Déjà suivi : touche pour ne plus suivre" : "Ses prochaines publications remonteront dans ton fil"}
      // 32 pt de haut à l'écran, 48 pt sous le doigt
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`h-8 flex-row items-center gap-1 rounded-full px-3 active:opacity-70 ${suivi ? "border border-white/70 bg-black/30" : "bg-jaune"}`}
    >
      {suivi ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      <Text className={`font-texte-gras text-[13px] ${suivi ? "text-white" : "text-encre"}`}>{suivi ? "Suivi" : "Suivre"}</Text>
    </Pressable>
  );
}
