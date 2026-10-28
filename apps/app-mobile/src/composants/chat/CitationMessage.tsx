import { Pressable, Text } from "react-native";

import type { CitationChat } from "~/contenus/type-discussion-chat";
import { decrireCitation } from "~/fonctions/chat/decrire-citation";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";

type Props = {
  citation: CitationChat;
  auteur: string | null;
  deMoi: boolean;
  onPress?: () => void;
};

export function CitationMessage({ citation, auteur, deMoi, onPress }: Props) {
  const { langue } = utiliserLangue();
  const { vu } = decrireCitation(citation, langue);
  const indisponible = citation.etat !== "visible";
  return (
    <Pressable
      accessible={false}
      disabled={!onPress}
      onPress={
        onPress
          ? () => {
              vibrerLegerement();
              onPress();
            }
          : undefined
      }
      className={`mb-1.5 rounded-xl border-l-4 px-2.5 py-1.5 active:opacity-70 ${deMoi ? "border-nuit bg-lait/60" : "border-jaune bg-creme"}`}
    >
      {auteur && !indisponible ? (
        <Text selectable={false} numberOfLines={1} className={`font-texte-gras text-[13px] ${deMoi ? "text-nuit" : "text-encre"}`}>
          {auteur}
        </Text>
      ) : null}
      <Text selectable={false} numberOfLines={2} className={`font-texte text-[13px] leading-[18px] ${deMoi ? "text-nuit/80" : "text-gris"} ${indisponible ? "italic" : ""}`}>
        {lierPonctuation(vu)}
      </Text>
    </Pressable>
  );
}
