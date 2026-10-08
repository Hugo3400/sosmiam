import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import { Pressable, Text } from "react-native";

import { INDICE_COMPTE } from "~/contenus/indice-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  suivi: boolean;
  /** Auteur lu par VoiceOver : « @lea.mange » ou le nom du lieu */
  nom: string;
  /** Faux en visite sans compte : le fil ouvrira « Crée ton compte », et VoiceOver le dit avant qu'on touche */
  avecCompte: boolean;
  /** Pas suivi : suit tout de suite. Suivi : le fil demande confirmation avant de ne plus suivre */
  onPress: () => void;
};

// Un double appui sur « Suivre » ne doit pas enchaîner sur « Ne plus suivre ? » : le second appui est ignoré
const DELAI_ANTI_DOUBLE_APPUI = 700;

/** « Suivre » (jaune) ou « Suivi » (discret, avec une coche) à côté du nom de l'auteur, sur la fiche posée sur la vidéo. */
export function BoutonSuivre({ suivi, nom, avecCompte, onPress }: Props) {
  const dernierAppui = useRef(0);
  return (
    <Pressable
      accessibilityRole="button"
      // L'état est dans le libellé, en français (pas d'état « sélectionné » en plus, il ferait doublon) ; il commence par le mot
      // affiché, pour que Commande vocale trouve le bouton (« Toucher Suivi »)
      accessibilityLabel={suivi ? `Suivi, tu suis ${nom}` : `Suivre ${nom}`}
      accessibilityHint={!avecCompte ? INDICE_COMPTE : suivi ? "Touche pour ne plus suivre" : "Ses prochaines publications passeront en tête de ton fil"}
      // 32 pt de haut à l'écran, 48 pt sous le doigt
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
      onPress={() => {
        const maintenant = Date.now();
        if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
        dernierAppui.current = maintenant;
        vibrerLegerement();
        onPress();
      }}
      className={`h-8 flex-row items-center gap-1 rounded-full px-3 active:opacity-70 ${suivi ? "border border-white/70 bg-black/30" : "bg-jaune"}`}
    >
      {suivi ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      <Text className={`font-texte-gras text-[13px] ${suivi ? "text-white" : "text-encre"}`}>{suivi ? "Suivi" : "Suivre"}</Text>
    </Pressable>
  );
}
