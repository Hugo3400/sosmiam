import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type ChoixMenu = "rescousse" | "adresse" | "pas-interesse" | "signaler";

type Props = {
  visible: boolean;
  nomLieu: string;
  sauve: boolean;
  restantes: number;
  onChoisir: (choix: ChoixMenu) => void;
  onFermer: () => void;
};

/** Le menu « ⋯ » d'une publication, qui monte du bas : rescousse, adresse, pas intéressé, signaler. */
export function MenuPublication({ visible, nomLieu, sauve, restantes, onChoisir, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const epuisees = !sauve && restantes <= 0;
  const options: { choix: ChoixMenu; emoji: string; titre: string; detail: string; desactive?: boolean }[] = [
    {
      choix: "rescousse",
      emoji: "🛟",
      titre: sauve ? "Reprendre ma rescousse" : "Donner une rescousse",
      detail: sauve ? "Elle te sera rendue pour un autre lieu" : epuisees ? "Plus de rescousse cette semaine, reviens lundi !" : `Il t'en reste ${restantes} cette semaine`,
      desactive: epuisees,
    },
    { choix: "adresse", emoji: "📍", titre: "Voir l'adresse", detail: "Horaires, plat signature, itinéraire" },
    { choix: "pas-interesse", emoji: "🙈", titre: "Pas intéressé", detail: "On t'en montrera moins comme ça" },
    { choix: "signaler", emoji: "🚩", titre: "Signaler", detail: "Contenu choquant, faux lieu, publicité cachée…" },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFermer}>
      <Pressable accessibilityLabel="Fermer le menu" onPress={onFermer} className="flex-1 bg-black/40" />
      <View accessibilityViewIsModal style={{ paddingBottom: marges.bottom + 12 }} className="rounded-t-3xl border-t-2 border-encre bg-creme px-5 pt-3">
        <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
        <Text accessibilityRole="header" numberOfLines={1} className="mb-2 font-titre text-2xl text-encre">{nomLieu}</Text>
        {options.map((o) => (
          <Pressable
            key={o.choix}
            accessibilityRole="button"
            accessibilityState={{ disabled: o.desactive }}
            accessibilityHint={o.detail}
            disabled={o.desactive}
            onPress={() => {
              vibrerLegerement();
              onChoisir(o.choix);
            }}
            className={`min-h-14 flex-row items-center gap-4 border-b border-ligne py-3 active:opacity-70 ${o.desactive ? "opacity-40" : ""}`}
          >
            <Text className="text-2xl">{o.emoji}</Text>
            <View className="flex-1">
              <Text className="font-texte-gras text-base text-encre">{o.titre}</Text>
              <Text className="font-texte text-sm text-gris">{o.detail}</Text>
            </View>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={onFermer} className="mt-3 min-h-12 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80">
          <Text className="font-texte-gras text-base text-encre">Annuler</Text>
        </Pressable>
      </View>
    </Modal>
  );
}
