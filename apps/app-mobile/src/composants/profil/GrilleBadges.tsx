import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { BADGES } from "@sos-miam/commun/contenus/badges";
import type { IdBadge } from "@sos-miam/commun/types/badge";
import { MESURES_BADGES_DEMO } from "~/contenus/badges-demo";
import { PRECISIONS_BADGES } from "~/contenus/precisions-badges";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  /** Identifiants des badges obtenus : ceux du compte, ou en démo ceux comptés sur le téléphone (listerBadgesObtenus) */
  obtenus: string[];
  /** Démo : seuls les badges de MESURES_BADGES_DEMO se gagnent sur le téléphone */
  demo: boolean;
};

const POSSIBLE = "À débloquer, c'est possible dès maintenant !";
const SOUS_CLE_DEMO = "Dans la démo, celui-ci reste sous clé : il se gagne pour de vrai avec un compte.";

/**
 * Tes badges en grille (le catalogue partagé, BADGES) : les obtenus en couleur, les autres estompés avec 🔒. Touche un
 * badge pour savoir comment l'obtenir.
 */
export function GrilleBadges({ obtenus, demo }: Props) {
  const [choisi, setChoisi] = useState<IdBadge | null>(null);
  const detail = BADGES.find((b) => b.id === choisi) ?? null;
  // Ce qui reste à faire pour un badge pas encore obtenu
  const direCommentObtenir = (id: IdBadge) => {
    const precision = PRECISIONS_BADGES[id];
    if (precision && !precision.possible) return precision.texte;
    if (demo) return MESURES_BADGES_DEMO[id] ? POSSIBLE : SOUS_CLE_DEMO;
    return precision?.texte ?? POSSIBLE;
  };

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Tes badges</Text>
        <Text accessibilityLabel={`${obtenus.length} sur ${BADGES.length}`} className="font-texte-semi text-sm text-gris">{obtenus.length}/{BADGES.length}</Text>
      </View>

      <View className="-m-1 flex-row flex-wrap">
        {BADGES.map((badge) => {
          const obtenu = obtenus.includes(badge.id);
          const selectionne = badge.id === choisi;
          return (
            <Pressable
              key={badge.id}
              accessibilityRole="button"
              accessibilityLabel={`${badge.nom}, ${obtenu ? "obtenu" : "à débloquer"}. ${badge.texte}.${obtenu ? "" : ` ${direCommentObtenir(badge.id)}`}`}
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
              {lierPonctuation(obtenus.includes(detail.id) ? "✅ Obtenu, bravo !" : `🔒 ${direCommentObtenir(detail.id)}`)}
            </Text>
          </>
        ) : (
          <Text className="font-texte text-sm text-gris">👆 Touche un badge pour savoir comment l'obtenir.</Text>
        )}
      </View>
    </View>
  );
}
