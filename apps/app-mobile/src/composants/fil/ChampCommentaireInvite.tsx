import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";

type Props = {
  /** Ouvre la feuille « Crée ton compte » (la feuille des commentaires se referme d'abord) */
  onCreerCompte: () => void;
  /** Place sous le bouton (bord du téléphone) */
  margeBas: number;
};

/** En visite sans compte, à la place du champ des commentaires : on lit tout, et un bouton pour pouvoir écrire. */
export function ChampCommentaireInvite({ onCreerCompte, margeBas }: Props) {
  return (
    <View style={{ paddingBottom: margeBas }} className="gap-2 border-t border-ligne bg-creme px-4 pt-3">
      <Bouton
        libelle="Crée ton compte pour commenter"
        variante="jaune"
        petit
        indice="Une minute, et tu pourras écrire, répondre et aimer les commentaires"
        onPress={onCreerCompte}
      />
      {/* Lu sans l'emoji (VoiceOver dirait « yeux ») */}
      <Text accessibilityLabel="Pour lire, pas besoin de compte : régale-toi" className="text-center font-texte text-xs text-gris">
        Pour lire, pas besoin de compte : régale-toi 👀
      </Text>
    </View>
  );
}
