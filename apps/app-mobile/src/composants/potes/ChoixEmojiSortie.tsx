import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  choisi: string;
  onChoisir: (emoji: string) => void;
  /** Nom du groupe de choix lu par VoiceOver (« Emoji de la sortie » par défaut) */
  libelle?: string;
};

/** Les emoji proposés pour une sortie, avec un nom lu par le lecteur d'écran (le premier est celui par défaut) */
const EMOJIS = [
  { emoji: "🍽️", nom: "Resto" },
  { emoji: "🍕", nom: "Pizza" },
  { emoji: "🍣", nom: "Sushis" },
  { emoji: "🍔", nom: "Burger" },
  { emoji: "🥐", nom: "Brunch" },
  { emoji: "🍰", nom: "Goûter" },
  { emoji: "🎉", nom: "Fête" },
  { emoji: "🛶", nom: "Grand air" },
];

/** Choisir l'emoji d'une sortie parmi quelques-uns : un seul choix, dit par son nom. */
export function ChoixEmojiSortie({ choisi, onChoisir, libelle = "Emoji de la sortie" }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={libelle} className="flex-row flex-wrap gap-x-1 gap-y-2">
      {EMOJIS.map((e, i) => {
        const actif = e.emoji === choisi;
        return (
          <Pressable
            key={e.emoji}
            // Sur iPhone, une radio est lue en anglais : bouton « sélectionné », avec sa place dans la liste ; radio cochée ou non ailleurs
            accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
            accessibilityState={Platform.OS === "ios" ? { selected: actif } : { checked: actif }}
            accessibilityLabel={Platform.OS === "ios" ? `${e.nom}, ${i + 1} sur ${EMOJIS.length}` : e.nom}
            onPress={() => {
              vibrerLegerement();
              onChoisir(e.emoji);
            }}
            className="w-[72px] items-center gap-1 py-1 active:opacity-70"
          >
            <View className={`h-[52px] w-[52px] items-center justify-center rounded-full border-2 ${actif ? "border-encre bg-jaune" : "border-ligne bg-white"}`}>
              <Text allowFontScaling={false} style={{ fontSize: 26, lineHeight: 32 }}>
                {e.emoji}
              </Text>
            </View>
            <Text numberOfLines={1} className={`text-xs ${actif ? "font-texte-gras text-encre" : "font-texte text-gris"}`}>
              {e.nom}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
