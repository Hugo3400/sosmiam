import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { badges } from "~/contenus/badges";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Identifiants des badges obtenus (listerBadgesObtenus) */
  obtenus: string[];
};

// Badge verrouillé sans mesure suivie sur le téléphone : il attend les visites validées (API)
const ATTEND_VISITES = "Il arrivera avec les visites validées, bientôt dans l'app.";

/** Tes badges en grille : les obtenus en couleur, les autres estompés avec 🔒. Touche un badge pour savoir comment l'obtenir. */
export function GrilleBadges({ obtenus }: Props) {
  const [choisi, setChoisi] = useState<string | null>(null);
  const detail = badges.find((b) => b.id === choisi) ?? null;

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Tes badges</Text>
        <Text accessibilityLabel={`${obtenus.length} sur ${badges.length}`} className="font-texte-semi text-sm text-gris">{obtenus.length}/{badges.length}</Text>
      </View>

      <View className="-m-1 flex-row flex-wrap">
        {badges.map((badge) => {
          const obtenu = obtenus.includes(badge.id);
          const selectionne = badge.id === choisi;
          return (
            <Pressable
              key={badge.id}
              accessibilityRole="button"
              accessibilityLabel={`${badge.nom}, ${obtenu ? "obtenu" : "à débloquer"}. ${badge.texte}.${obtenu || badge.mesure ? "" : ` ${ATTEND_VISITES}`}`}
              accessibilityState={{ selected: selectionne }}
              onPress={() => {
                vibrerLegerement();
                setChoisi(selectionne ? null : badge.id);
              }}
              style={{ width: "25%" }}
              className="p-1 active:opacity-70"
            >
              <View className={`min-h-24 items-center justify-center gap-1 rounded-2xl border-2 p-1.5 ${selectionne ? "border-tomate" : "border-encre"} ${obtenu ? "bg-jaune-clair" : "bg-white"}`}>
                {/* Seul l'emoji est estompé : le nom reste bien lisible (gris sur blanc) */}
                <View className="items-center gap-1">
                  <Text className={`text-3xl ${obtenu ? "" : "opacity-40"}`}>{badge.emoji}</Text>
                  <Text numberOfLines={2} className={`text-center font-texte-semi text-xs leading-4 ${obtenu ? "text-encre" : "text-gris"}`}>{badge.nom}</Text>
                </View>
                {obtenu ? null : <Text className="absolute right-1 top-1 text-xs">🔒</Text>}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Le détail du badge touché (déjà lu dans le libellé de chaque badge par le lecteur d'écran) */}
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="min-h-16 justify-center rounded-2xl border-2 border-ligne bg-white px-4 py-3">
        {detail ? (
          <>
            <Text className="font-texte-gras text-base text-encre">{detail.emoji} {detail.nom}</Text>
            <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(detail.texte)}</Text>
            <Text className="mt-1 font-texte-semi text-sm text-encre">
              {lierPonctuation(obtenus.includes(detail.id) ? "✅ Obtenu, bravo !" : detail.mesure ? "🔒 À débloquer, c'est possible dès maintenant !" : `🔒 ${ATTEND_VISITES}`)}
            </Text>
          </>
        ) : (
          <Text className="font-texte text-sm text-gris">👆 Touche un badge pour savoir comment l'obtenir.</Text>
        )}
      </View>
    </View>
  );
}
