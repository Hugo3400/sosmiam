import { Pressable, Text, View } from "react-native";

import type { CommentaireActus } from "@sos-miam/commun/types/actus";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import type { TEXTES_ACTUS } from "~/contenus/textes-actus";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

type Props = {
  commentaire: CommentaireActus;
  T: Traduction<typeof TEXTES_ACTUS>["article"];
  avecCompte: boolean;
  onRepondre: () => void;
  onSupprimer: () => void;
  onSignaler: () => void;
};

export function LigneCommentaireActus({ commentaire: c, T, avecCompte, onRepondre, onSupprimer, onSignaler }: Props) {
  const action = (libelle: string, faire: () => void) => (
    <Pressable key={libelle} accessibilityRole="button" hitSlop={6} onPress={faire} className="min-h-9 justify-center active:opacity-70">
      <Text className="font-texte-gras text-xs text-gris">{libelle}</Text>
    </Pressable>
  );
  if (c.supprime) {
    return <Text className={`font-texte text-sm italic text-gris ${c.reponseA ? "ml-11" : ""}`}>{T.commenter.supprime}</Text>;
  }
  return (
    <View className={`flex-row gap-3 ${c.reponseA ? "ml-11" : ""}`}>
      <EmojiOuMiami valeur={c.auteur.avatar} taille={32} className="text-2xl" />
      <View className="flex-1 gap-0.5">
        <Text accessible className="font-texte-gras text-sm text-encre">
          {c.auteur.prenom}
          <Text className="font-texte text-xs text-gris">{` · ${c.plume ? `${T.plume} · ` : ""}${formaterIlYA(c.ecritLe).court}`}</Text>
        </Text>
        <Text className="font-texte text-sm leading-5 text-encre">{c.texte}</Text>
        {avecCompte ? (
          <View className="flex-row gap-4">
            {action(T.commenter.repondre, onRepondre)}
            {c.mien ? action(T.commenter.supprimer, onSupprimer) : action(T.commenter.signaler, onSignaler)}
          </View>
        ) : null}
      </View>
    </View>
  );
}
