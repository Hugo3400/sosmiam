import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import type { Suggestion, TypeSuggestion } from "~/contenus/type-suggestion";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  suggestion: Suggestion;
  /** Messages du bouton Suivre (« 🔔 Tu suis maintenant … ! ») */
  onAnnoncer: (texte: string) => void;
  /** ✕ touché : la carte part (le compte requis est vérifié par le carrousel) */
  onMasquer: () => void;
  /** La zone qui ouvre la carte : le carrousel y pose VoiceOver quand la carte d'à côté est masquée */
  refOuvrir?: (vue: View | null) => void;
};

export const LARGEUR_CARTE_SUGGESTION = 150;
const TAILLE_ROND = 56;
const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };

const indices: Record<TypeSuggestion, string> = {
  personne: "Ouvre son profil",
  createur: "Ouvre sa page",
  lieu: "Ouvre la fiche du lieu",
};

// Personne : son avatar sur jaune clair (comme dans Ma bande) ; créateur : 🎬 sur jaune ; lieu : son dégradé
const fondsRond: Record<TypeSuggestion, string> = { personne: "bg-jaune-clair", createur: "bg-jaune", lieu: "bg-jaune" };

/**
 * Une carte de « Tu pourrais suivre » : rond, nom et raison (toucher ouvre le profil, la page ou la fiche), le bouton Suivre
 * compact, et ✕ pour ne plus se la voir proposer. Pour VoiceOver : la carte, puis « Suivre », puis « Masquer la suggestion ».
 */
export function CarteSuggestion({ suggestion, onAnnoncer, onMasquer, refOuvrir }: Props) {
  const router = useRouter();
  const { cle, type, emoji, nom, raison, degrade, ouvrir } = suggestion;

  return (
    <View style={{ width: LARGEUR_CARTE_SUGGESTION }} className="rounded-carte border-2 border-encre bg-white">
      <Pressable
        ref={refOuvrir}
        accessibilityRole="button"
        accessibilityLabel={`${nom}, ${raison}`}
        accessibilityHint={indices[type]}
        onPress={() => {
          vibrerLegerement();
          router.push(ouvrir);
        }}
        className="flex-1 items-center gap-1.5 px-3 pb-2 pt-4 active:opacity-70"
      >
        <View
          style={{ width: TAILLE_ROND, height: TAILLE_ROND, borderRadius: TAILLE_ROND / 2 }}
          className={`items-center justify-center overflow-hidden border-2 border-encre ${fondsRond[type]}`}
        >
          {degrade ? <LinearGradient colors={degrade} start={DEBUT_DEGRADE} end={FIN_DEGRADE} style={{ position: "absolute", inset: 0 }} /> : null}
          {/* Taille fixe : l'emoji suit le rond, pas la taille de texte du système */}
          <Text allowFontScaling={false} style={{ fontSize: TAILLE_ROND * 0.5, lineHeight: TAILLE_ROND * 0.64 }}>
            {emoji}
          </Text>
        </View>
        <Text numberOfLines={1} className="text-center font-texte-gras text-[15px] text-encre">
          {nom}
        </Text>
        <Text numberOfLines={2} className="text-center font-texte text-[13px] leading-[18px] text-gris">
          {raison}
        </Text>
      </Pressable>

      <View className="items-center px-2 pb-3">
        <BoutonSuivreProfil cle={cle} nom={nom} emoji={emoji} onAnnoncer={onAnnoncer} taille="compact" />
      </View>

      {/* Après la carte et son bouton dans l'ordre de lecture ; 28 pt à l'écran, 44 pt sous le doigt */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Masquer la suggestion ${nom}`}
        accessibilityHint="On ne te la proposera plus"
        onPress={() => {
          vibrerLegerement();
          onMasquer();
        }}
        className="absolute right-0 top-0 h-11 w-11 items-center justify-center active:opacity-60"
      >
        <View className="h-7 w-7 items-center justify-center rounded-full border border-ligne bg-creme">
          <Ionicons name="close" size={15} color={couleurs.gris} />
        </View>
      </Pressable>
    </View>
  );
}
