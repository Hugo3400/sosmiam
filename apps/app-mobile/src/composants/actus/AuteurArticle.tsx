import { Text, View } from "react-native";

import type { AuteurActus } from "@sos-miam/commun/types/actus";
import { PastilleAmbassadeur } from "~/composants/actus/PastilleAmbassadeur";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";

type Props = { auteur: AuteurActus; details: string; ambassadeur: string };

export function AuteurArticle({ auteur, details, ambassadeur }: Props) {
  return (
    <View accessible className="flex-row items-center gap-3">
      <EmojiOuMiami valeur={auteur.avatar} taille={40} className="text-3xl" />
      <View className="flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="font-texte-gras text-[15px] text-encre">{auteur.prenom}</Text>
          {auteur.ambassadeur ? <PastilleAmbassadeur libelle={ambassadeur} /> : null}
        </View>
        <Text className="font-texte text-[13px] text-gris">{details}</Text>
      </View>
    </View>
  );
}
