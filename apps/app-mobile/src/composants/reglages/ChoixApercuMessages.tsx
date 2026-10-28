import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_REGLAGES_MESSAGES_PAR_LANGUE } from "~/contenus/textes-reglages-messages";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  apercuMessages: boolean;
  onChanger: (apercuMessages: boolean) => void;
};

const CHOIX = [
  { valeur: true, emoji: "💬", cle: "entier" },
  { valeur: false, emoji: "🤫", cle: "discret" },
] as const;

export function ChoixApercuMessages({ apercuMessages, onChanger }: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_MESSAGES_PAR_LANGUE).apercu;
  return (
    <View className="gap-1">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        {T.titre}
      </Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={T.titre}>
        {CHOIX.map((choix) => {
          const choisi = apercuMessages === choix.valeur;
          const { titre, detail } = T[choix.cle];
          return (
            <Pressable
              key={choix.cle}
              accessibilityRole="radio"
              accessibilityState={{ checked: choisi }}
              accessibilityLabel={`${titre}, ${detail}`}
              onPress={() => {
                if (choisi) return;
                vibrerLegerement();
                onChanger(choix.valeur);
              }}
              className="min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70"
            >
              <Text className="text-2xl">{choix.emoji}</Text>
              <View className="flex-1">
                <Text className="font-texte-gras text-base text-encre">{titre}</Text>
                <Text className="font-texte text-sm text-gris">{lierPonctuation(detail)}</Text>
              </View>
              <View className={`h-7 w-7 items-center justify-center rounded-full border-2 border-encre ${choisi ? "bg-choix" : "bg-carte"}`}>
                {choisi ? <Ionicons name="checkmark" size={16} color={couleurs["sur-choix"]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View className="mt-2 flex-row items-start gap-2">
        <Ionicons name="lock-closed" size={14} color={couleurs.gris} style={{ marginTop: 3 }} />
        <Text className="flex-1 font-texte text-sm leading-5 text-gris">
          {lierPonctuation(T.chiffre)}
        </Text>
      </View>
    </View>
  );
}
