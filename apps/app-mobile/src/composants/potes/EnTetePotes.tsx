import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Ton profil communautaire (utiliserCommunaute().moi) */
  moi: Pote;
};

/** Le haut de Potes : le titre, les boutons « Messages » (avec les non-lus) et « Ajouter », et ton avatar avec ton @pseudo qui ouvrent ton profil de pote. */
export function EnTetePotes({ moi }: Props) {
  const router = useRouter();
  const { nonLus } = utiliserConversations();

  return (
    <View className="gap-3 pt-2">
      <View className="flex-row items-center gap-3">
        <Text accessibilityRole="header" className="flex-1 font-titre text-[32px] leading-[36px] text-encre">
          Tes potes
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={nonLus > 0 ? `Messages, ${nonLus} non lu${nonLus > 1 ? "s" : ""}` : "Messages"}
          accessibilityHint="Tes discussions avec ta bande, en privé ou en groupe"
          onPress={() => {
            vibrerLegerement();
            router.push("/potes/messages");
          }}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="chatbubbles" size={20} color={couleurs.encre} />
          {nonLus > 0 ? (
            <View className="absolute -right-2 -top-2 min-w-5 items-center rounded-full border-2 border-creme bg-rouge-texte px-1">
              <Text allowFontScaling={false} className="font-texte-gras text-[11px] text-white">
                {nonLus > 99 ? "99+" : nonLus}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un pote"
          accessibilityHint="Par son pseudo, ton lien ou ton QR code"
          onPress={() => {
            vibrerLegerement();
            router.push("/potes/ajouter");
          }}
          className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-4 active:opacity-80"
        >
          <Ionicons name="person-add" size={16} color={couleurs.encre} />
          <Text className="font-texte-gras text-[15px] text-encre">Ajouter</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={moi.pseudo ? `Ton profil de pote, @${moi.pseudo}` : "Ton profil de pote"}
        accessibilityHint="Ce que tes potes voient de toi"
        onPress={() => {
          vibrerLegerement();
          router.push({ pathname: "/potes/profil/[id]", params: { id: ID_MOI } });
        }}
        className="min-h-11 flex-row items-center gap-2.5 self-start rounded-full border-2 border-encre bg-white py-1 pl-1 pr-3 active:opacity-80"
      >
        <RondPote pote={moi} taille={40} />
        <View className="shrink">
          <Text numberOfLines={1} className="font-texte-gras text-[15px] text-encre">
            {moi.pseudo ? `@${moi.pseudo}` : moi.prenom}
          </Text>
          <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
            Ton profil de pote
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
