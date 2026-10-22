import Ionicons from "@expo/vector-icons/Ionicons";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { RondGroupe } from "~/composants/chat/RondGroupe";
import { TEXTES_INFOS_GROUPE as T } from "~/contenus/textes-infos-groupe";
import type { ConversationEnrichie } from "~/contenus/type-discussion-chat";
import { nommerGroupe } from "~/fonctions/chat/nommer-groupe";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  conversation: ConversationEnrichie;
  admin: boolean;
  aUnePhoto: boolean;
  detail: string;
  photoEnCours: boolean;
  onChangerPhoto: () => void;
  onRetirerPhoto: () => void;
  onRenommer: () => void;
};

const TAILLE = 76;

export function EnTeteInfosGroupe({ conversation, admin, aUnePhoto, detail, photoEnCours, onChangerPhoto, onRetirerPhoto, onRenommer }: Props) {
  const couleurs = utiliserCouleurs();
  const titre = nommerGroupe(conversation.titre);
  return (
    <View className="flex-row items-center gap-3.5">
      <View style={{ width: TAILLE, height: TAILLE }}>
        <RondGroupe conversation={conversation} taille={TAILLE} />
        {admin ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={aUnePhoto ? T.changerPhoto : T.ajouterPhoto}
            accessibilityState={{ busy: photoEnCours, disabled: photoEnCours }}
            disabled={photoEnCours}
            hitSlop={8}
            onPress={() => {
              vibrerLegerement();
              onChangerPhoto();
            }}
            style={{ position: "absolute", right: -4, bottom: -4 }}
            className="h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
          >
            {photoEnCours ? <ActivityIndicator size="small" color={couleurs.nuit} /> : <Ionicons name="camera" size={14} color={couleurs.nuit} />}
          </Pressable>
        ) : null}
      </View>
      <View className="flex-1 gap-0.5">
        <Pressable
          accessibilityRole={admin ? "button" : "header"}
          accessibilityLabel={titre}
          accessibilityHint={admin ? T.renommerIndice : undefined}
          disabled={!admin}
          onPress={() => {
            vibrerLegerement();
            onRenommer();
          }}
          className="flex-row items-center gap-2 active:opacity-70"
        >
          <Text className="shrink font-titre text-2xl leading-7 text-encre">{titre}</Text>
          {admin ? <Ionicons name="pencil" size={16} color={couleurs.encre} /> : null}
        </Pressable>
        <Text className="font-texte text-sm text-gris">{detail}</Text>
        {admin && aUnePhoto ? (
          <Pressable accessibilityRole="button" hitSlop={6} onPress={onRetirerPhoto} disabled={photoEnCours} className="min-h-8 justify-center self-start active:opacity-70">
            <Text className="font-texte-semi text-sm text-encre underline">{T.retirerPhoto}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
