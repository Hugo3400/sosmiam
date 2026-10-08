import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ActionPost } from "~/composants/fil/ActionPost";
import { BoueeEnvol } from "~/composants/fil/BoueeEnvol";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  lieu: Lieu;
  hauteur: number;
  /** « Parce que tu aimes les restos »… */
  raison: string | null;
  sauve: boolean;
  garde: boolean;
  /** Numéro de la dernière rescousse donnée à ce lieu (déclenche la bouée qui s'envole) */
  envol: number;
  /** Visible à l'écran : seul ce lieu anime son emoji */
  visible: boolean;
  onRescousse: () => void;
  /** Double appui sur le lieu : donne une rescousse (sans jamais la reprendre) */
  onDoubleAppui: () => void;
  onGarder: () => void;
  onPartager: () => void;
  onVoir: () => void;
};

const DELAI_DOUBLE_APPUI = 280;
const ombreTexte = { textShadowColor: "rgba(0,0,0,0.45)", textShadowRadius: 6 };

/** Un lieu en plein écran dans le fil « Pour toi » : son dégradé, son emoji, ses infos et la colonne d'actions. */
export function PostLieu({ lieu, hauteur, raison, sauve, garde, envol, visible, onRescousse, onDoubleAppui, onGarder, onPartager, onVoir }: Props) {
  const animationsReduites = useReducedMotion();
  const respiration = useSharedValue(1);
  const cadre = useSharedValue(1);
  const dernierAppui = useRef(0);

  useEffect(() => {
    if (!visible || animationsReduites) {
      respiration.value = 1;
      cadre.value = 1;
      return;
    }
    respiration.value = withRepeat(withTiming(1.07, { duration: 2000, easing: Easing.inOut(Easing.sin) }), -1, true);
    if (lieu.sos) cadre.value = withRepeat(withTiming(0.35, { duration: 800 }), -1, true);
  }, [visible, animationsReduites, lieu.sos, respiration, cadre]);

  const styleEmoji = useAnimatedStyle(() => ({ transform: [{ scale: respiration.value }] }));
  const styleCadre = useAnimatedStyle(() => ({ opacity: cadre.value }));

  function appuiSurLeFond() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_DOUBLE_APPUI) onDoubleAppui();
    dernierAppui.current = maintenant;
  }

  const deniche = lieu.nouveau && !lieu.decouvertPar;
  const description = [lieu.nom, lieu.info, lieu.sos ? `SOS : ${lieu.sos.places} places jusqu'à ${formaterHeure(lieu.sos.jusqua)}` : null, lieu.alerte,
    raison, `${lieu.quartier}, ${lieu.ville}, à ${formaterDistance(lieu.km)}, ${lieu.prix}`, lieu.texte].filter(Boolean).join(". ");

  return (
    <View style={{ height: hauteur }} className="overflow-hidden">
      <LinearGradient colors={lieu.couleurs} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ position: "absolute", inset: 0 }} />

      {/* Double appui n'importe où sur le fond : rescousse (VoiceOver passe par le bouton 🛟) */}
      <Pressable onPress={appuiSurLeFond} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", inset: 0 }}>
        <Animated.Text style={[{ position: "absolute", top: hauteur * 0.24, alignSelf: "center", fontSize: Math.min(140, hauteur * 0.17) }, styleEmoji]}>
          {lieu.emoji}
        </Animated.Text>
      </Pressable>

      <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: hauteur * 0.6 }} />

      <View className="absolute inset-x-0 bottom-0 pb-6 pl-5 pr-[92px]">
        <View accessible accessibilityLabel={description} className="gap-1.5">
          <View className="flex-row flex-wrap gap-2">
            {lieu.sos ? (
              <Text className="overflow-hidden rounded-full bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
                🛟 SOS · {lieu.sos.places} places jusqu'à {formaterHeure(lieu.sos.jusqua)}
              </Text>
            ) : null}
            {lieu.alerte ? (
              <Text className="overflow-hidden rounded-full bg-tomate px-3 py-1 font-texte-gras text-[13px] text-white">🔥 {lieu.alerte}</Text>
            ) : null}
            {deniche ? (
              <Text className="overflow-hidden rounded-full bg-white px-3 py-1 font-texte-gras text-[13px] text-encre">
                {sauve ? "🚀 Déniché par toi !" : "✨ Nouveau · sois son premier sauveteur"}
              </Text>
            ) : null}
          </View>
          {raison ? <Text className="font-texte-semi text-sm text-jaune-clair" style={ombreTexte}>💛 {raison}</Text> : null}
          <Text className="font-titre text-[30px] leading-[34px] text-white" style={ombreTexte}>{lieu.nom}</Text>
          <Text className="font-texte-moyen text-[15px] text-white/90" style={ombreTexte}>
            📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(lieu.km)} · {lieu.prix}
          </Text>
          <Text numberOfLines={3} className="font-texte text-[15px] leading-[21px] text-white" style={ombreTexte}>
            {lierPonctuation(lieu.texte)}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Voir l'adresse de ${lieu.nom}`}
          onPress={onVoir}
          className="mt-3 min-h-11 self-start justify-center rounded-full bg-white/25 px-4 active:opacity-70"
        >
          <Text className="font-texte-semi text-[15px] text-white">Voir l'adresse →</Text>
        </Pressable>
      </View>

      <View className="absolute bottom-7 right-3 items-center gap-5">
        <ActionPost
          style="sos"
          actif={sauve}
          icone={<Text className="text-2xl">🛟</Text>}
          libelle={String(lieu.rescousses + (sauve ? 1 : 0))}
          description={sauve ? `Reprendre ta rescousse à ${lieu.nom}` : `Donner une rescousse à ${lieu.nom}, ${lieu.rescousses} rescousses`}
          onPress={onRescousse}
        />
        <ActionPost
          actif={garde}
          icone={<Ionicons name={garde ? "bookmark" : "bookmark-outline"} size={24} color="#FFFFFF" />}
          libelle={garde ? "Gardé" : "Garder"}
          description={garde ? `Ne plus garder ${lieu.nom}` : `Garder ${lieu.nom} pour plus tard`}
          onPress={onGarder}
        />
        <ActionPost
          icone={<Ionicons name="share-outline" size={24} color="#FFFFFF" />}
          libelle="Partager"
          description={`Partager ${lieu.nom}`}
          onPress={onPartager}
        />
      </View>

      {lieu.sos ? (
        <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, borderWidth: 5, borderColor: couleurs.jaune }, styleCadre]} />
      ) : null}
      <BoueeEnvol numero={envol} />
    </View>
  );
}
