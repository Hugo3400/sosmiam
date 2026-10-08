import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import type { Conversation } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { listerPrenomsDiscussion } from "~/fonctions/chat/lister-prenoms-discussion";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  conversation: Conversation;
  /** Les autres membres qu'on montre (sans toi ni les personnes bloquées) ; pour un message privé, le pote */
  membres: Pote[];
  onRetour: () => void;
  /** Ouvre le menu de la conversation (« ⋯ », ou toucher le nom d'un groupe) */
  onOptions: () => void;
  onVoirProfil: (poteId: string) => void;
};

const TAILLE = 44;

/** Le haut d'une conversation : retour, puis le pote (vers son profil) ou le groupe (emoji, titre, membres), et « ⋯ » pour le menu. */
export function EnTeteDiscussion({ conversation, membres, onRetour, onOptions, onVoirProfil }: Props) {
  const groupe = conversation.type === "groupe";
  const pote = groupe ? null : (membres[0] ?? null);
  const prenoms = listerPrenomsDiscussion(membres);
  const titre = groupe ? (conversation.titre ?? "Groupe") : (pote?.prenom ?? "Quelqu'un");
  const nombre = membres.length + 1;

  return (
    <View className="flex-row items-center gap-2.5 border-b-2 border-ligne px-4 pb-2.5 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        onPress={onRetour}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={groupe ? `${titre}, groupe de ${nombre} : ${prenoms}` : pote ? `${titre}, @${pote.pseudo}` : titre}
        accessibilityHint={groupe ? "Voir les membres du groupe" : pote ? "Ouvre son profil" : undefined}
        accessibilityState={{ disabled: !groupe && !pote }}
        disabled={!groupe && !pote}
        onPress={() => {
          vibrerLegerement();
          if (groupe) onOptions();
          else if (pote) onVoirProfil(pote.id);
        }}
        className="min-h-12 flex-1 flex-row items-center gap-2.5 active:opacity-70"
      >
        {pote ? (
          <RondPote pote={pote} taille={TAILLE} />
        ) : (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: TAILLE, height: TAILLE, borderRadius: TAILLE / 2 }}
            className="items-center justify-center border-2 border-encre bg-jaune-clair"
          >
            {/* Taille fixe : l'emoji suit le rond, pas la taille de texte du système */}
            <Text allowFontScaling={false} style={{ fontSize: TAILLE * 0.5, lineHeight: TAILLE * 0.64 }}>
              {groupe ? (conversation.emoji ?? "💬") : "👤"}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text numberOfLines={1} className="font-titre text-xl leading-6 text-encre">
            {titre}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] leading-[18px] text-gris">
            {groupe ? prenoms : pote ? `@${pote.pseudo} · voir son profil` : "Plus sur SOS Miam"}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={groupe ? "Options du groupe" : "Options de la discussion"}
        accessibilityHint={groupe ? "Voir les membres, quitter le groupe" : "Voir le profil, signaler ou bloquer"}
        hitSlop={8}
        onPress={() => {
          vibrerLegerement();
          onOptions();
        }}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
