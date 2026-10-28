import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { CommentaireIdee } from "@sos-miam/commun/types/idees";
import { RondMiami } from "~/composants/miamis/RondMiami";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";
import { vibrerJaime } from "~/fonctions/interaction/vibrer-jaime";
import { ecrireIlYa } from "~/fonctions/miamis/ecrire-il-y-a";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  commentaire: CommentaireIdee;
  reponse: boolean;
  monId: string;
  peutRepondre: boolean;
  onAimer: (oui: boolean) => void;
  onRepondre: () => void;
  onOptions: () => void;
};

export function LigneCommentaireIdee({ commentaire, reponse, monId, peutRepondre, onAimer, onRepondre, onOptions }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_IDEES_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const { auteur } = commentaire;
  const nom = auteur.id === monId ? T.parToi : `@${auteur.pseudo}`;
  const quand = ecrireIlYa(commentaire.date, langue);
  return (
    <View className={`flex-row items-start gap-2.5 ${reponse ? "ml-11 border-l-2 border-ligne pl-3" : ""}`}>
      <RondMiami personne={auteur} taille={reponse ? 28 : 34} />
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row items-center justify-between gap-2">
          <Text accessibilityLabel={`${nom}, ${quand}`} className="shrink font-texte text-[13px] text-gris">
            <Text className="font-texte-semi text-encre">{nom}</Text>
            {` · ${quand}`}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.optionsCommentaire(auteur.pseudo)}
            hitSlop={6}
            onPress={onOptions}
            className="h-8 w-8 items-center justify-center rounded-full active:opacity-60"
          >
            <Ionicons name="ellipsis-horizontal" size={18} color={couleurs.gris} />
          </Pressable>
        </View>
        <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(commentaire.texte)}</Text>
        <View className="flex-row items-center gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.aimer(commentaire.jaime)}
            accessibilityState={{ selected: commentaire.aime }}
            hitSlop={6}
            onPress={() => {
              vibrerJaime();
              onAimer(!commentaire.aime);
            }}
            className="min-h-8 flex-row items-center gap-1.5 active:opacity-60"
          >
            <Ionicons name={commentaire.aime ? "heart" : "heart-outline"} size={16} color={commentaire.aime ? couleurs.tomate : couleurs.gris} />
            <Text className={`font-texte-semi text-[13px] ${commentaire.aime ? "text-rouge-texte" : "text-gris"}`} style={{ fontVariant: ["tabular-nums"] }}>
              {commentaire.jaime}
            </Text>
          </Pressable>
          {peutRepondre ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.repondreA(auteur.pseudo)}
              hitSlop={6}
              onPress={onRepondre}
              className="min-h-8 justify-center active:opacity-60"
            >
              <Text className="font-texte-semi text-[13px] text-gris">{T.repondre}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
