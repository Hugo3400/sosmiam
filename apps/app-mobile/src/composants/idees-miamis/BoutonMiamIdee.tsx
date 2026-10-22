import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text } from "react-native";

import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  idee: IdeeMiamis;
  onVoter: (oui: boolean) => void;
  grand?: boolean;
  occupe?: boolean;
};

export function BoutonMiamIdee({ idee, onVoter, grand = false, occupe = false }: Props) {
  const couleurs = utiliserCouleurs();
  const libelle = `${idee.aVote ? TEXTES_IDEES.retirerVote(idee.titre) : TEXTES_IDEES.voter(idee.titre)}, ${TEXTES_IDEES.votesLus(idee.votes)}`;
  const fond = idee.aVote ? "border-2 border-encre bg-jaune" : grand ? "border-2 border-encre bg-creme" : "border border-ligne bg-creme";
  const texte = idee.aVote ? "text-nuit" : "text-encre";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityState={{ selected: idee.aVote, busy: occupe }}
      hitSlop={4}
      onPress={() => {
        if (occupe) return;
        vibrerLegerement();
        onVoter(!idee.aVote);
      }}
      className={`items-center justify-center rounded-2xl active:scale-95 ${fond} ${grand ? "h-[52px] flex-row gap-1.5 px-4" : "h-[76px] w-[62px]"}`}
    >
      <Ionicons name="chevron-up" size={grand ? 20 : 18} color={idee.aVote ? couleurs.nuit : couleurs.encre} />
      {grand ? (
        <Text className={`font-texte-gras text-base ${texte}`} style={{ fontVariant: ["tabular-nums"] }}>
          {`${TEXTES_IDEES.miam} ${idee.votes}`}
        </Text>
      ) : (
        <>
          <Text className={`font-texte-gras text-[15px] ${texte}`} style={{ fontVariant: ["tabular-nums"] }}>
            {idee.votes}
          </Text>
          <Text className={`font-texte-semi text-[10px] ${texte}`}>{TEXTES_IDEES.miam}</Text>
        </>
      )}
    </Pressable>
  );
}
