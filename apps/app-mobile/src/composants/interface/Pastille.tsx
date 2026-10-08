import { Platform, Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  libelle: string;
  emoji?: string;
  choisi: boolean;
  onPress: () => void;
  /** « radio » quand un seul choix est possible (ex. la ville) */
  role?: "checkbox" | "radio";
  /** Place de la pastille dans son groupe (à partir de 1) et taille du groupe : dites sur iPhone, où le groupe n'est pas annoncé */
  position?: number;
  total?: number;
  /** Ce qui se passe quand on touche, lu par le lecteur d'écran (ex. « Touche encore pour l'enlever ») */
  indice?: string;
};

/** Un choix à toucher : blanc, ou encre et jaune une fois coché. Au moins 44 points de haut. */
export function Pastille({ libelle, emoji, choisi, onPress, role = "checkbox", position, total, indice }: Props) {
  const ios = Platform.OS === "ios";
  const place = ios && position !== undefined && total !== undefined ? `, ${position} sur ${total}` : "";
  return (
    <Pressable
      // Sur iPhone, les rôles « case à cocher » et « radio » et l'état « coché » sont lus en anglais : bouton « sélectionné »,
      // avec sa place dans le groupe. Ailleurs, case ou radio cochée ou non (TalkBack dit alors « non coché » aux autres)
      accessibilityRole={ios ? "button" : role}
      accessibilityState={ios ? { selected: choisi } : { checked: choisi }}
      accessibilityLabel={`${libelle}${place}`}
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre px-4 py-2.5 active:opacity-80 ${choisi ? "bg-encre" : "bg-white"}`}
    >
      {emoji ? <Text className="text-base">{emoji}</Text> : null}
      <Text className={`font-texte-semi text-[15px] ${choisi ? "text-jaune" : "text-encre"}`}>{libelle}</Text>
    </Pressable>
  );
}
