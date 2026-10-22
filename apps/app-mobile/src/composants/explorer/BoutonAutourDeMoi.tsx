import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  actif: boolean;
  recherche: boolean;
  onToucher: () => void;
  onArreter: () => void;
};

const INDICE_INACTIF =
  "Trie les lieux du plus proche au plus loin. Ta position n'est lue que quand tu touches, gardée en mémoire et jamais enregistrée";
const INDICE_ACTIF = "Autour de moi est actif : relit où tu es, pour des distances à jour";

export function BoutonAutourDeMoi({ actif, recherche, onToucher, onArreter }: Props) {
  const couleurs = utiliserCouleurs();
  const refBouton = useRef<View>(null);
  const precedent = useRef(actif);
  useEffect(() => {
    if (precedent.current === actif) return;
    precedent.current = actif;
    if (actif && Platform.OS !== "web") AccessibilityInfo.announceForAccessibility("Autour de moi : les lieux les plus proches d'abord");
  }, [actif]);

  const libelle = recherche ? "On te cherche…" : "Autour de moi";
  const libelleLu = recherche ? libelle : actif ? "Autour de moi, actualiser ta position" : libelle;
  const couleurIcone = actif ? couleurs.jaune : couleurs.encre;

  function arreter() {
    vibrerLegerement();
    onArreter();
    setTimeout(() => deplacerFocusLecteurEcran(refBouton.current), 150);
  }

  return (
    <View className={`relative self-start ${recherche ? "opacity-80" : ""}`}>
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <View className={`min-h-11 flex-row items-center rounded-full border-2 border-encre ${actif ? "bg-nuit" : "bg-carte"}`}>
        <Pressable
          ref={refBouton}
          accessibilityRole="button"
          accessibilityLabel={libelleLu}
          accessibilityHint={actif ? INDICE_ACTIF : INDICE_INACTIF}
          accessibilityState={{ disabled: recherche, ...(Platform.OS === "ios" ? {} : { busy: recherche }) }}
          disabled={recherche}
          onPress={() => {
            vibrerLegerement();
            onToucher();
          }}
          className={`min-h-11 flex-row items-center gap-2 rounded-full active:opacity-70 ${actif ? "pl-4 pr-0.5" : "px-4"}`}
        >
          {recherche ? (
            <ActivityIndicator size="small" color={couleurIcone} />
          ) : (
            <Ionicons name={actif ? "navigate" : "navigate-outline"} size={18} color={couleurIcone} />
          )}
          <Text className={`font-texte-gras text-[15px] ${actif ? "text-jaune" : "text-encre"}`}>{libelle}</Text>
        </Pressable>
        {actif ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Arrêter Autour de moi"
            accessibilityHint="Oublie ta position : les distances ne partiront plus de toi"
            onPress={arreter}
            className="h-11 w-11 items-center justify-center rounded-r-full active:opacity-60"
          >
            <View className="h-6 w-6 items-center justify-center rounded-full bg-jaune">
              <Ionicons name="close" size={16} color={couleurs.nuit} />
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
