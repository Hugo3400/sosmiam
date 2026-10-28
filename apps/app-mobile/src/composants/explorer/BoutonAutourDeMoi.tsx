import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  actif: boolean;
  recherche: boolean;
  onToucher: () => void;
  onArreter: () => void;
};

export function BoutonAutourDeMoi({ actif, recherche, onToucher, onArreter }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE).autourDeMoi;
  const refBouton = useRef<View>(null);
  const precedent = useRef(actif);
  useEffect(() => {
    if (precedent.current === actif) return;
    precedent.current = actif;
    if (actif && Platform.OS !== "web") AccessibilityInfo.announceForAccessibility(T.annonceActif);
  }, [actif, T.annonceActif]);

  const libelle = recherche ? T.enCours : T.libelle;
  const libelleLu = recherche ? libelle : actif ? T.actualiserLu : libelle;
  const couleurIcone = actif ? couleurs["sur-choix"] : couleurs.encre;

  function arreter() {
    vibrerLegerement();
    onArreter();
    setTimeout(() => deplacerFocusLecteurEcran(refBouton.current), 150);
  }

  return (
    <View className={`relative self-start ${recherche ? "opacity-80" : ""}`}>
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <View className={`min-h-11 flex-row items-center rounded-full border-2 border-encre ${actif ? "bg-choix" : "bg-carte"}`}>
        <Pressable
          ref={refBouton}
          accessibilityRole="button"
          accessibilityLabel={libelleLu}
          accessibilityHint={actif ? T.indiceActif : T.indiceInactif}
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
          <Text className={`font-texte-gras text-[15px] ${actif ? "text-sur-choix" : "text-encre"}`}>{libelle}</Text>
        </Pressable>
        {actif ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.arreter}
            accessibilityHint={T.arreterIndice}
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
