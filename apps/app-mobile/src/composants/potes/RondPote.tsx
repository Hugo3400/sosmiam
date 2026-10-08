import { Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  pote: Pote;
  /** Diamètre en points */
  taille: number;
};

/** L'avatar d'un pote dans son rond (son emoji sur fond jaune clair) ; pour toi, ton avatar du profil (emoji ou photo). Décoratif : le prénom est lu à côté. */
export function RondPote({ pote, taille }: Props) {
  const { avatar } = utiliserProfil();
  if (pote.id === ID_MOI) return <ImageAvatar avatar={avatar} taille={taille} />;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className="items-center justify-center overflow-hidden border-2 border-encre bg-jaune-clair"
    >
      {/* Taille fixe : l'emoji suit le rond, pas la taille de texte du système */}
      <Text allowFontScaling={false} style={{ fontSize: taille * 0.52, lineHeight: taille * 0.66 }}>
        {pote.avatar}
      </Text>
    </View>
  );
}
