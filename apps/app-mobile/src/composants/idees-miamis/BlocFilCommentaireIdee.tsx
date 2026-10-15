import { View } from "react-native";

import type { CommentaireIdee } from "@sos-miam/commun/types/idees";
import { LigneCommentaireIdee } from "~/composants/idees-miamis/LigneCommentaireIdee";
import type { FilCommentaireIdee } from "~/fonctions/idees-miamis/ranger-commentaires-idee";

type Props = {
  fil: FilCommentaireIdee;
  monId: string;
  onAimer: (commentaire: CommentaireIdee, oui: boolean) => void;
  onRepondre: (commentaire: CommentaireIdee) => void;
  onOptions: (commentaire: CommentaireIdee) => void;
};

export function BlocFilCommentaireIdee({ fil, monId, onAimer, onRepondre, onOptions }: Props) {
  return (
    <View className="gap-3.5">
      {[fil.commentaire, ...fil.reponses].map((commentaire) => (
        <LigneCommentaireIdee
          key={commentaire.id}
          commentaire={commentaire}
          reponse={commentaire.id !== fil.commentaire.id}
          monId={monId}
          peutRepondre
          onAimer={(oui) => onAimer(commentaire, oui)}
          onRepondre={() => onRepondre(commentaire)}
          onOptions={() => onOptions(commentaire)}
        />
      ))}
    </View>
  );
}
