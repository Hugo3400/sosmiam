import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

import type { VisibiliteListe } from "@sos-miam/commun/types/listes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import couleurs from "~/theme/couleurs";

type Props = {
  choisie: VisibiliteListe;
  onChoisir: (visibilite: VisibiliteListe) => void;
};

const CHOIX: { cle: VisibiliteListe; emoji: string; nom: string; detail: string }[] = [
  { cle: "tous", emoji: "🌍", nom: "Tout le monde", detail: "Tous ceux qui peuvent voir ton profil." },
  { cle: "bande", emoji: "🫶", nom: "Ma bande", detail: "Seulement les potes de ta bande : un carnet d'adresses entre initiés." },
];

/** « Qui la voit ? » : tout le monde (ceux qui voient ton profil) ou seulement ta bande. Un seul choix. */
export function ChoixVisibiliteListe({ choisie, onChoisir }: Props) {
  const ios = Platform.OS === "ios";
  return (
    <View accessibilityRole="radiogroup" className="gap-2">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
        Qui la voit ?
      </Text>
      {CHOIX.map((c, i) => {
        const actif = c.cle === choisie;
        return (
          <Pressable
            key={c.cle}
            // Sur iPhone, « radio » et « coché » sont lus en anglais : bouton « sélectionné », avec sa place dans le groupe
            accessibilityRole={ios ? "button" : "radio"}
            accessibilityState={ios ? { selected: actif } : { checked: actif }}
            accessibilityLabel={`Qui la voit : ${c.nom}. ${c.detail}${ios ? `, ${i + 1} sur ${CHOIX.length}` : ""}`}
            onPress={() => {
              vibrerLegerement();
              onChoisir(c.cle);
            }}
            className={`min-h-14 flex-row items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5 active:opacity-80 ${actif ? "border-encre bg-jaune-clair" : "border-ligne bg-white"}`}
          >
            <Text allowFontScaling={false} className="text-2xl">
              {c.emoji}
            </Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">{c.nom}</Text>
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(c.detail)}</Text>
            </View>
            <View className={`h-6 w-6 items-center justify-center rounded-full border-2 border-encre ${actif ? "bg-encre" : "bg-white"}`}>
              {actif ? <Ionicons name="checkmark" size={14} color={couleurs.jaune} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
