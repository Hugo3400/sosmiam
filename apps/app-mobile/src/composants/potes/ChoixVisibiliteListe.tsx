import Ionicons from "@expo/vector-icons/Ionicons";
import { Platform, Pressable, Text, View } from "react-native";

import type { VisibiliteListe } from "@sos-miam/commun/types/listes";
import { TEXTES_LISTES_PARTAGEES_PAR_LANGUE } from "~/contenus/textes-listes-partagees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  choisie: VisibiliteListe;
  onChoisir: (visibilite: VisibiliteListe) => void;
};

const CHOIX: { cle: VisibiliteListe; emoji: string }[] = [
  { cle: "tous", emoji: "🌍" },
  { cle: "bande", emoji: "🫶" },
];

/** « Qui la voit ? » : tout le monde (ceux qui voient ton profil) ou seulement ta bande. Un seul choix. */
export function ChoixVisibiliteListe({ choisie, onChoisir }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE);
  const ios = Platform.OS === "ios";
  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
        {T.visibilite.titre}
      </Text>
      {CHOIX.map((c, i) => {
        const { nom, detail } = T.visibilite[c.cle];
        const actif = c.cle === choisie;
        return (
          <Pressable
            key={c.cle}
            // Sur iPhone, « radio » et « coché » sont lus en anglais : bouton « sélectionné », avec sa place dans le groupe
            accessibilityRole={ios ? "button" : "radio"}
            accessibilityState={ios ? { selected: actif } : { checked: actif }}
            accessibilityLabel={`${T.visibilite.choixLu(nom, detail)}${ios ? `, ${T.position(i + 1, CHOIX.length)}` : ""}`}
            onPress={() => {
              vibrerLegerement();
              onChoisir(c.cle);
            }}
            className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 active:opacity-80 ${actif ? "border-encre bg-jaune-clair" : "border-ligne bg-carte"}`}
          >
            <Text allowFontScaling={false} className="text-2xl">
              {c.emoji}
            </Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">{nom}</Text>
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(detail)}</Text>
            </View>
            <View className={`h-6 w-6 items-center justify-center rounded-full border-2 border-encre ${actif ? "bg-choix" : "bg-carte"}`}>
              {actif ? <Ionicons name="checkmark" size={14} color={couleurs["sur-choix"]} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
