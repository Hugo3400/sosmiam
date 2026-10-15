import { View } from "react-native";

import type { PersonneResume } from "@sos-miam/commun/types/social";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  personne: PersonneResume;
  taille: number;
  fond?: string;
};

export function RondMiami({ personne, taille, fond = "bg-jaune-clair" }: Props) {
  const { avatar } = utiliserProfil();
  const monId = utiliserMonId();
  if (monId !== "" && personne.id === monId) return <ImageAvatar avatar={avatar} taille={taille} />;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      className={`items-center justify-center overflow-hidden border-2 border-encre ${fond}`}
    >
      <EmojiOuMiami valeur={personne.avatar} personneId={personne.id} taille={taille - 4} allowFontScaling={false} style={{ fontSize: taille * 0.52, lineHeight: taille * 0.66 }} />
    </View>
  );
}
