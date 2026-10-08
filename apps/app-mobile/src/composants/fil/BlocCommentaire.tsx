import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { LigneCommentaire } from "~/composants/fil/LigneCommentaire";
import type { FilCommentaire } from "~/fonctions/communaute/trier-commentaires";
import couleurs from "~/theme/couleurs";

type Props = {
  fil: FilCommentaire;
  lieu: Pick<Lieu, "nom" | "emoji">;
  maintenant: number;
  /** Réponses affichées ou repliées (« Voir 3 réponses ») */
  deplie: boolean;
  onBasculer: (commentaireId: string) => void;
  /** « Répondre » sur le commentaire ou sur une de ses réponses (un seul niveau : tout se range sous le commentaire) */
  onRepondre: (commentaire: Commentaire, reponseA: Commentaire) => void;
  onOptions: (commentaire: Commentaire) => void;
};

/** Un commentaire et ses réponses, repliables. */
export function BlocCommentaire({ fil, lieu, maintenant, deplie, onBasculer, onRepondre, onOptions }: Props) {
  const { commentaire, reponses } = fil;
  const nombre = reponses.length;
  const dontLeLieu = reponses.some((r) => r.auteur === "lieu");

  return (
    <View>
      <LigneCommentaire
        commentaire={commentaire}
        lieu={lieu}
        reponse={false}
        maintenant={maintenant}
        onRepondre={(c) => onRepondre(c, c)}
        onOptions={onOptions}
      />
      {deplie
        ? reponses.map((r) => (
            <LigneCommentaire key={r.id} commentaire={r} lieu={lieu} reponse maintenant={maintenant} onRepondre={(c) => onRepondre(c, commentaire)} onOptions={onOptions} />
          ))
        : null}
      {nombre > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deplie ? "Masquer les réponses" : `Voir ${nombre} réponse${nombre > 1 ? "s" : ""}${dontLeLieu ? ", dont celle du lieu" : ""}`}
          accessibilityState={{ expanded: deplie }}
          onPress={() => onBasculer(commentaire.id)}
          className="ml-[52px] min-h-11 flex-row items-center gap-2 self-start active:opacity-60"
        >
          <View className="h-px w-6 bg-gris" />
          <Text className="font-texte-semi text-[13px] text-gris">
            {deplie ? "Masquer les réponses" : `Voir ${nombre} réponse${nombre > 1 ? "s" : ""}${dontLeLieu ? " · dont le lieu 💛" : ""}`}
          </Text>
          <Ionicons name={deplie ? "chevron-up" : "chevron-down"} size={14} color={couleurs.gris} />
        </Pressable>
      ) : null}
    </View>
  );
}
