import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { IdBadge } from "@sos-miam/commun/types/badge";
import { FamilleBadges } from "~/composants/profil/FamilleBadges";
import { FAMILLES_BADGES } from "~/contenus/familles-badges";
import { TEXTES_BADGES } from "~/contenus/textes-badges";
import { grouperBadgesParFamille } from "~/fonctions/ambassadeur/grouper-badges-par-famille";
import { listerBadgesObtenus } from "~/fonctions/ambassadeur/lister-badges-obtenus";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserSession } from "~/hooks/utiliser-session";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

const FAMILLES = grouperBadgesParFamille(BADGES, FAMILLES_BADGES);
const MARGE_EN_VUE = 16;

export default function Badges() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { connecte, compte } = utiliserSession();
  const activite = utiliserActivite();
  const animationsReduites = useReducedMotion();
  const [choisi, setChoisi] = useState<IdBadge | null>(null);
  const defilement = useRef<ScrollView>(null);
  const repere = useRef<View>(null);
  const decalage = useRef(0);
  const hauteurVisible = useRef(0);

  const obtenus: readonly string[] | null = DEMO_VISITES_ACTIVE
    ? listerBadgesObtenus({ rescousses: activite.rescoussesDonnees, "premiers-sauvetages": activite.premiersSauvetages.length })
    : (compte?.badges ?? null);
  const nombreObtenus = obtenus ? BADGES.filter((b) => obtenus.includes(b.id)).length : 0;
  const complete = nombreObtenus >= BADGES.length;
  const sousTitre = obtenus ? (complete ? TEXTES_BADGES.collectionComplete : TEXTES_BADGES.sousTitre(nombreObtenus, BADGES.length)) : null;
  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/profil"));

  const montrer = useCallback(
    (haut: number, bas: number) => {
      const visible = hauteurVisible.current;
      if (visible === 0) return;
      const debut = decalage.current;
      let cible: number | null = null;
      if (bas + MARGE_EN_VUE > debut + visible) cible = Math.min(haut - MARGE_EN_VUE, bas + MARGE_EN_VUE - visible);
      else if (haut - MARGE_EN_VUE < debut) cible = haut - MARGE_EN_VUE;
      if (cible === null) return;
      const y = Math.max(0, cible);
      requestAnimationFrame(() => defilement.current?.scrollTo({ y, animated: !animationsReduites }));
    },
    [animationsReduites],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TEXTES_BADGES.retour}
          hitSlop={12}
          onPress={revenir}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView
        ref={defilement}
        className="flex-1"
        contentContainerClassName="px-5 pb-8"
        scrollEventThrottle={32}
        onScroll={(evenement) => {
          decalage.current = evenement.nativeEvent.contentOffset.y;
        }}
        onLayout={(evenement) => {
          hauteurVisible.current = evenement.nativeEvent.layout.height;
        }}
      >
        <View ref={repere}>
          <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">
            {lierPonctuation(TEXTES_BADGES.titre)}
          </Text>
          {sousTitre ? <Text className="mt-2 font-texte text-base leading-6 text-gris">{lierPonctuation(sousTitre)}</Text> : null}
          <View className="mt-6">
            {obtenus ? (
              <View className="gap-7">
                {complete ? null : <Text className="-mt-3 font-texte text-sm text-gris">{lierPonctuation(TEXTES_BADGES.aide)}</Text>}
                {FAMILLES.map((famille) => (
                  <FamilleBadges
                    key={famille.titre}
                    titre={famille.titre}
                    badges={famille.badges}
                    obtenus={obtenus}
                    choisi={choisi}
                    demo={DEMO_VISITES_ACTIVE}
                    repere={repere}
                    onChoisir={setChoisi}
                    onMontrer={montrer}
                  />
                ))}
              </View>
            ) : (
              <View className="flex-row items-center gap-3 rounded-carte border-2 border-encre bg-carte p-5">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-3xl">
                  {connecte ? "📶" : "🔑"}
                </Text>
                <Text className="flex-1 font-texte-semi text-base text-encre">
                  {lierPonctuation(connecte ? TEXTES_BADGES.attenteReseau : TEXTES_BADGES.sansSession)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
