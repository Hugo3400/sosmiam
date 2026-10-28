import { Platform, Pressable, Text, View } from "react-native";

import { TEXTES_CHOIX_SORTIE_PAR_LANGUE } from "~/contenus/textes-choix-sortie";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  choisi: string;
  onChoisir: (emoji: string) => void;
  /** Nom du groupe de choix lu par VoiceOver (« Emoji de la sortie » par défaut) */
  libelle?: string;
};

/** Les emoji proposés pour une sortie, avec un nom lu par le lecteur d'écran (le premier est celui par défaut) */
const EMOJIS = ["🍽️", "🍕", "🍣", "🍔", "🥐", "🍰", "🎉", "🛶"];

/** Choisir l'emoji d'une sortie parmi quelques-uns : un seul choix, dit par son nom. */
export function ChoixEmojiSortie({ choisi, onChoisir, libelle }: Props) {
  const T = utiliserTextes(TEXTES_CHOIX_SORTIE_PAR_LANGUE);
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={libelle ?? T.emoji.libelle} className="flex-row flex-wrap gap-x-1 gap-y-2">
      {EMOJIS.map((emoji, i) => ({ emoji, nom: T.emoji.noms[i] ?? "" })).map((e, i) => {
        const actif = e.emoji === choisi;
        return (
          <Pressable
            key={e.emoji}
            // Sur iPhone, une radio est lue en anglais : bouton « sélectionné », avec sa place dans la liste ; radio cochée ou non ailleurs
            accessibilityRole={Platform.OS === "ios" ? "button" : "radio"}
            accessibilityState={Platform.OS === "ios" ? { selected: actif } : { checked: actif }}
            accessibilityLabel={Platform.OS === "ios" ? `${e.nom}, ${T.position(i + 1, EMOJIS.length)}` : e.nom}
            onPress={() => {
              vibrerLegerement();
              onChoisir(e.emoji);
            }}
            className="w-[72px] items-center gap-1 py-1 active:opacity-70"
          >
            <View className={`h-[52px] w-[52px] items-center justify-center rounded-full border-2 ${actif ? "border-encre bg-jaune" : "border-ligne bg-carte"}`}>
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
