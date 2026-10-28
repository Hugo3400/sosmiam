import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondGroupe } from "~/composants/chat/RondGroupe";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { TEXTES_CHAT_LISTE_PAR_LANGUE } from "~/contenus/textes-chat-liste";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { listerPrenomsDiscussion } from "~/fonctions/chat/lister-prenoms-discussion";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";

type Props = {
  conversation: ConversationEnrichie;
  /** Les autres membres qu'on montre (sans toi ni les personnes bloquées) ; pour un message privé, le pote */
  membres: Pote[];
  onRetour: () => void;
  /** Ouvre le menu de la conversation (« ⋯ ») */
  onOptions: () => void;
  onVoirProfil: (poteId: string) => void;
  onVoirGroupe: () => void;
};

const TAILLE = 44;

/** Le haut d'une conversation : retour, puis le pote (vers son profil) ou le groupe (photo ou emoji, titre, membres : vers ses infos), et « ⋯ » pour le menu. */
export function EnTeteDiscussion({ conversation, membres, onRetour, onOptions, onVoirProfil, onVoirGroupe }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CHAT_LISTE_PAR_LANGUE);
  const T_APERCUS = utiliserTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE);
  const groupe = conversation.type === "groupe";
  const pote = groupe ? null : (membres[0] ?? null);
  const prenoms = listerPrenomsDiscussion(membres, langue);
  const titre = groupe ? nommerGroupe(conversation.titre, langue) : (pote?.prenom ?? T_APERCUS.compteSupprime);
  const nombre = membres.length + 1;

  return (
    <View className="flex-row items-center gap-2.5 border-b-2 border-ligne px-4 pb-2.5 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.retour}
        hitSlop={8}
        onPress={onRetour}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={groupe ? T.groupeDe(titre, nombre, prenoms) : pote ? `${titre}, @${pote.pseudo}` : titre}
        accessibilityHint={groupe ? T.ouvreInfosGroupe : pote ? T.ouvreProfil : undefined}
        accessibilityState={{ disabled: !groupe && !pote }}
        disabled={!groupe && !pote}
        onPress={() => {
          vibrerLegerement();
          if (groupe) onVoirGroupe();
          else if (pote) onVoirProfil(pote.id);
        }}
        className="min-h-12 flex-1 flex-row items-center gap-2.5 active:opacity-70"
      >
        {pote ? (
          <RondPote pote={pote} taille={TAILLE} />
        ) : groupe ? (
          <RondGroupe conversation={conversation} taille={TAILLE} />
        ) : (
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{ width: TAILLE, height: TAILLE, borderRadius: TAILLE / 2 }}
            className="items-center justify-center border-2 border-encre bg-jaune-clair"
          >
            {/* Taille fixe : l'emoji suit le rond, pas la taille de texte du système */}
            <Text allowFontScaling={false} style={{ fontSize: TAILLE * 0.5, lineHeight: TAILLE * 0.64 }}>
              👤
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text numberOfLines={1} className="font-titre text-xl leading-6 text-encre">
            {titre}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] leading-[18px] text-gris">
            {groupe ? prenoms : pote ? T.voirSonProfil(pote.pseudo) : T.plusSurSosMiam}
          </Text>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={groupe ? T.optionsGroupe : T.optionsDiscussion}
        accessibilityHint={groupe ? T.optionsGroupeIndice : T.optionsDiscussionIndice}
        hitSlop={8}
        onPress={() => {
          vibrerLegerement();
          onOptions();
        }}
        className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={couleurs.encre} />
      </Pressable>
    </View>
  );
}
