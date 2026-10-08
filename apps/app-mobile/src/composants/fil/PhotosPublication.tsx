import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View, type ImageSourcePropType, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { cancelAnimation, Easing, ReduceMotion, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { BarresPhotos } from "~/composants/fil/BarresPhotos";
import type { MediaPublication } from "~/contenus/type-publication";
import { utiliserGestesStables } from "~/hooks/utiliser-gestes-stables";

type Props = {
  photos: Extract<MediaPublication, { type: "photos" }>["photos"];
  largeur: number;
  hauteur: number;
  /** Publication affichée à l'écran : c'est là qu'on montre qu'on peut faire glisser les photos, et qu'elles défilent seules */
  actif: boolean;
  /** Appui sur une photo (deux appuis rapprochés : « J'aime », géré par la publication) */
  onAppui: () => void;
  /** Hauteur du compteur, juste sous l'en-tête du fil */
  haut: number;
};

// Petit glissement montré une fois, pour qu'on comprenne tout de suite qu'il y a d'autres photos à côté
const APERCU_GLISSEMENT = { delai: 700, distance: 56, retour: 380 };
// Temps passé sur chaque photo avant la suivante (défilement façon stories)
const DUREE_PHOTO = 4000;

type GestesPhotos = {
  lancer: (depuis: number) => void;
  passerALaSuivante: () => void;
  poserDoigt: () => void;
  leverDoigt: () => void;
};

/**
 * Photos d'une publication, en plein écran : elles défilent seules (barres façon stories en haut), en boucle, tant que la
 * publication est à l'écran ; on peut aussi les faire glisser de côté (le décompte repart de la photo choisie), et un doigt
 * posé met le défilement en pause. Rien ne défile seul quand les animations sont réduites : les barres restent comme repère.
 */
export function PhotosPublication({ photos, largeur, hauteur, actif, haut, onAppui }: Props) {
  const animationsReduites = useReducedMotion();
  const liste = useRef<FlatList<ImageSourcePropType>>(null);
  const [actuelle, setActuelle] = useState(0);
  // Doigt en train de faire glisser les photos : le défilement attend qu'on lâche
  const [glisse, setGlisse] = useState(false);
  const avancee = useSharedValue(0);
  const apercuMontre = useRef(false);
  const indexActuel = useRef(0);
  // Photo visée par un défilement automatique : on ne compte pas celles qu'il traverse (retour au début de la boucle)
  const cible = useRef<number | null>(null);
  const doigtPose = useRef(false);
  const defilementPossible = useRef(false);
  const plusieurs = photos.length > 1;

  // Fonctions stables (photos mémorisées), qui lisent toujours l'état le plus récent
  const gestes: GestesPhotos = utiliserGestesStables<GestesPhotos>({
    // La barre de la photo en cours se remplit en DUREE_PHOTO ; pleine, on passe à la suivante (rappel depuis le fil d'animation)
    lancer: (depuis: number) => {
      const passerALaSuivante = gestes.passerALaSuivante;
      avancee.value = depuis;
      avancee.value = withTiming(1, { duration: DUREE_PHOTO * (1 - depuis), easing: Easing.linear, reduceMotion: ReduceMotion.Never }, (fini) => {
        "worklet";
        if (fini) scheduleOnRN(passerALaSuivante);
      });
    },
    passerALaSuivante: () => {
      if (!defilementPossible.current || doigtPose.current) return;
      const suivante = (indexActuel.current + 1) % photos.length;
      cible.current = suivante;
      liste.current?.scrollToOffset({ offset: suivante * largeur, animated: true });
    },
    // Un doigt posé sur la photo met le défilement en pause ; il reprend où il en était quand on le lève
    poserDoigt: () => {
      doigtPose.current = true;
      cancelAnimation(avancee);
    },
    leverDoigt: () => {
      doigtPose.current = false;
      if (defilementPossible.current) gestes.lancer(Math.min(Math.max(avancee.value, 0), 1));
    },
  });

  // Défilement automatique : seulement à l'écran, avec plusieurs photos, sans animations réduites et sans doigt qui glisse.
  // Chaque nouvelle photo (ou la fin d'un glissement à la main) relance le décompte depuis le début.
  useEffect(() => {
    defilementPossible.current = actif && plusieurs && !animationsReduites && !glisse;
    if (!plusieurs) return;
    if (!actif) {
      cancelAnimation(avancee);
      avancee.value = 0;
      cible.current = null;
      return;
    }
    if (animationsReduites) {
      avancee.value = 1;
      return;
    }
    if (glisse || doigtPose.current) return;
    gestes.lancer(0);
    return () => cancelAnimation(avancee);
  }, [actif, plusieurs, animationsReduites, glisse, actuelle, avancee, gestes]);

  useEffect(() => {
    if (!actif || !plusieurs || animationsReduites || apercuMontre.current) return;
    const aller = setTimeout(() => {
      apercuMontre.current = true;
      liste.current?.scrollToOffset({ offset: APERCU_GLISSEMENT.distance, animated: true });
    }, APERCU_GLISSEMENT.delai);
    const retour = setTimeout(() => liste.current?.scrollToOffset({ offset: 0, animated: true }), APERCU_GLISSEMENT.delai + APERCU_GLISSEMENT.retour);
    return () => {
      clearTimeout(aller);
      clearTimeout(retour);
    };
  }, [actif, plusieurs, animationsReduites]);

  function auDefilement(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.x / largeur), 0), photos.length - 1);
    if (index === indexActuel.current) return;
    if (cible.current !== null) {
      if (index !== cible.current) return;
      cible.current = null;
    }
    // Barre vidée avant le nouveau rendu : la barre de la photo suivante ne s'affiche jamais pleine, même une image
    cancelAnimation(avancee);
    avancee.value = animationsReduites ? 1 : 0;
    indexActuel.current = index;
    setActuelle(index);
  }

  const afficherPhoto = useCallback(
    ({ item }: { item: ImageSourcePropType }) => (
      // Un appui laisse passer le glissement de côté ; deux appuis rapprochés font « J'aime » (VoiceOver passe par le bouton ❤️)
      <Pressable
        onPress={onAppui}
        onPressIn={gestes.poserDoigt}
        onPressOut={gestes.leverDoigt}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Image source={item} contentFit="cover" style={{ width: largeur, height: hauteur }} />
      </Pressable>
    ),
    [onAppui, gestes, largeur, hauteur],
  );

  return (
    <View style={{ position: "absolute", inset: 0 }}>
      <FlatList
        ref={liste}
        data={photos}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // Si on fait glisser soi-même, l'aperçu n'a plus lieu d'être, et c'est toi qui choisis la photo
        onScrollBeginDrag={() => {
          apercuMontre.current = true;
          cible.current = null;
          setGlisse(true);
        }}
        onScrollEndDrag={() => setGlisse(false)}
        onScroll={auDefilement}
        scrollEventThrottle={32}
        renderItem={afficherPhoto}
      />
      {plusieurs ? <BarresPhotos nombre={photos.length} actuelle={actuelle} avancee={avancee} largeur={largeur} haut={haut} /> : null}
      <View
        pointerEvents="none"
        accessible
        accessibilityLabel={plusieurs ? `Photo ${actuelle + 1} sur ${photos.length}` : "Photo"}
        style={{ top: haut }}
        className="absolute right-4 flex-row items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5"
      >
        <Ionicons name={plusieurs ? "images" : "image"} size={14} color="#FFFFFF" />
        <Text className="font-texte-gras text-xs text-white">{plusieurs ? `${actuelle + 1}/${photos.length}` : "Photo"}</Text>
      </View>
    </View>
  );
}
