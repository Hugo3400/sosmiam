import { Ionicons } from "@expo/vector-icons";
import { Platform, Pressable, Text, View } from "react-native";

import type { FilCommentaire } from "@sos-miam/commun/fonctions/commentaires/trier-commentaires";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { LigneCommentaire } from "~/composants/fil/LigneCommentaire";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  fil: FilCommentaire;
  lieu: Pick<Lieu, "nom" | "emoji">;
  maintenant: number;
  /** Réponses affichées ou repliées (« Voir 3 réponses ») */
  deplie: boolean;
  onBasculer: (commentaireId: string) => void;
  /** « Répondre » sur le commentaire ou sur une de ses réponses (un seul niveau : tout se range sous le commentaire) */
  onRepondre: (commentaire: Commentaire, reponseA: Commentaire, declencheur: View | null) => void;
  /** J'aime sur le commentaire ou une de ses réponses ; « declencheur » : le bouton touché */
  onAimer: (commentaire: Commentaire, declencheur: View | null) => void;
  /** Ouvre les options ; « declencheur » est ce qui les a ouvertes, où le lecteur d'écran revient ensuite */
  onOptions: (commentaire: Commentaire, declencheur: View | null) => void;
  /** Une mention touchée : le profil de la personne */
  onOuvrirProfil: (id: string) => void;
  /** Appui long sur un commentaire pour ses options (pas en visite sans compte) */
  appuiLong: boolean;
  /** Tu gères le lieu de la publication (options en plus) */
  gerant: boolean;
};

/** Un commentaire et ses réponses, repliables. */
export function BlocCommentaire({ fil, lieu, maintenant, deplie, onBasculer, onRepondre, onAimer, onOptions, onOuvrirProfil, appuiLong, gerant }: Props) {
  const couleurs = utiliserCouleurs();
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
        onRepondre={(c, d) => onRepondre(c, c, d)}
        onAimer={onAimer}
        onOptions={onOptions}
        onOuvrirProfil={onOuvrirProfil}
        appuiLong={appuiLong}
        gerant={gerant}
      />
      {deplie
        ? reponses.map((r) => (
            <LigneCommentaire
              key={r.id}
              commentaire={r}
              lieu={lieu}
              reponse
              maintenant={maintenant}
              onRepondre={(c, d) => onRepondre(c, commentaire, d)}
              onAimer={onAimer}
              onOptions={onOptions}
              onOuvrirProfil={onOuvrirProfil}
              appuiLong={appuiLong}
              gerant={gerant}
            />
          ))
        : null}
      {nombre > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={deplie ? "Masquer les réponses" : `Voir ${nombre} réponse${nombre > 1 ? "s" : ""}${dontLeLieu ? ", dont celle du lieu" : ""}`}
          // Le libellé dit déjà « Voir » ou « Masquer » : sur iPhone, l'état « déplié » serait lu en anglais (« expanded »)
          accessibilityState={Platform.OS === "ios" ? undefined : { expanded: deplie }}
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
