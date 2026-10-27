import { Text, View } from "react-native";

import type { CommentaireActus } from "@sos-miam/commun/types/actus";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { formaterIlYA } from "~/fonctions/dates/formater-il-y-a";

type Props = { commentaires: readonly CommentaireActus[]; auteurId: number; titre: string; plume: string };

export function CommentairesArticle({ commentaires, auteurId, titre, plume }: Props) {
  if (commentaires.length === 0) return null;
  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="font-titre-gras text-lg text-encre">
        {titre}
      </Text>
      {commentaires.map((c) => (
        <View key={c.id} accessible className="flex-row gap-3">
          <EmojiOuMiami valeur={c.auteur.avatar} taille={32} className="text-2xl" />
          <View className="flex-1 gap-0.5">
            <Text className="font-texte-gras text-sm text-encre">
              {c.auteur.prenom}
              <Text className="font-texte text-xs text-gris">{` · ${c.auteur.id === auteurId ? `${plume} · ` : ""}${formaterIlYA(c.ecritLe).court}`}</Text>
            </Text>
            <Text className="font-texte text-sm leading-5 text-encre">{c.texte}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
