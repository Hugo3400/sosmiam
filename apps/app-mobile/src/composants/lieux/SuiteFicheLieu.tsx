import { useNavigation, type NativeStackNavigationProp } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { ApercuCarte } from "~/composants/lieux/ApercuCarte";
import { InfosPratiquesLieu } from "~/composants/lieux/InfosPratiquesLieu";

type Props = {
  lieu: Lieu;
  /** Âge de la personne (null s'il est inconnu) : sous 18 ans, l'alcool est retiré de la carte */
  age: number | null;
};

// Filet de sécurité si la fin de l'animation d'arrivée ne vient pas (écran affiché sans animation…) : un peu plus que l'animation d'iOS
const DELAI_MAX_ARRIVEE = 600;
// Écran préparé en avance depuis le fil (router.prefetch) : on finit de le dessiner tranquillement, pendant que tu regardes la vidéo
const DELAI_ECRAN_PREPARE = 900;

/**
 * Vrai une fois l'écran arrivé : fin de son animation d'entrée (pile native), sinon après un court délai.
 * Sur le web (pas d'animation), juste après le premier affichage de la fiche.
 */
function utiliserArriveeTerminee(): boolean {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>();
  const [terminee, setTerminee] = useState(false);

  useEffect(() => {
    if (terminee) return;
    const terminer = () => setTerminee(true);

    if (Platform.OS === "web") {
      // requestAnimationFrame puis setTimeout : le navigateur affiche d'abord le haut de la fiche, puis on dessine la suite
      let minuterie: ReturnType<typeof setTimeout> | undefined;
      const image = requestAnimationFrame(() => {
        minuterie = setTimeout(terminer, 0);
      });
      return () => {
        cancelAnimationFrame(image);
        clearTimeout(minuterie);
      };
    }

    const desabonner = navigation.addListener("transitionEnd", (evenement) => {
      if (!evenement.data.closing) terminer();
    });
    const minuterie = setTimeout(terminer, navigation.isFocused() ? DELAI_MAX_ARRIVEE : DELAI_ECRAN_PREPARE);
    return () => {
      desabonner();
      clearTimeout(minuterie);
    };
  }, [navigation, terminee]);

  return terminee;
}

/**
 * Suite de la fiche d'un lieu (horaires, plat signature, aperçu de la carte, tags), dessinée juste après l'animation
 * d'arrivée pour que l'ouverture reste fluide, avec un fondu discret (aucun si les animations sont réduites).
 * Elle s'ajoute sous le haut de la fiche : rien ne bouge au-dessus. Mémorisée : une rescousse ne la redessine pas.
 */
export const SuiteFicheLieu = memo(function SuiteFicheLieu({ lieu, age }: Props) {
  const arrivee = utiliserArriveeTerminee();
  const animationsReduites = useReducedMotion();

  const sections = useMemo(
    () => [
      { emoji: "🕐", titre: "Horaires", texte: lieu.horaires },
      { emoji: "😋", titre: "Le plat signature", texte: lieu.plat },
      ...(lieu.decouvertPar ? [{ emoji: "🔎", titre: "Déniché par", texte: lieu.decouvertPar }] : []),
    ],
    [lieu],
  );

  if (!arrivee) return null;

  return (
    <Animated.View entering={animationsReduites ? undefined : FadeIn.duration(220)} style={styles.suite}>
      <View className="gap-3 rounded-carte border-2 border-encre bg-white p-5">
        {sections.map((s) => (
          <View key={s.titre} className="flex-row gap-3">
            <Text className="text-xl">{s.emoji}</Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-[15px] text-encre">{s.titre}</Text>
              <Text className="font-texte text-[15px] text-gris">{s.texte}</Text>
            </View>
          </View>
        ))}
      </View>

      <InfosPratiquesLieu nom={lieu.nom} pratique={lieu.pratique} />

      <ApercuCarte lieu={lieu} age={age} />

      <View className="flex-row flex-wrap gap-2">
        {lieu.tags.map((tag) => (
          <Text key={tag} className="overflow-hidden rounded-full bg-jaune-clair px-3 py-1.5 font-texte-moyen text-sm text-encre">
            {tag}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
});

// Mêmes écarts que le haut de la fiche (gap-4 px-5) : une fois affichée, la fiche est identique à l'ancienne
const styles = StyleSheet.create({
  suite: { gap: 16, paddingHorizontal: 20, paddingTop: 16 },
});
