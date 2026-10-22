import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { SelecteurEspaceCommunaute, type EspaceCommunaute } from "~/composants/potes/SelecteurEspaceCommunaute";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";

type Props = {
  /** Ton profil communautaire (utiliserCommunaute().moi) */
  moi: Pote;
  espace: EspaceCommunaute;
  onChoisirEspace: (espace: EspaceCommunaute) => void;
};

/** Le haut de Communauté : « Messages / Ma bande / Les Miamis » (avec les non-lus), le bouton « Ajouter », et ton avatar avec ton @pseudo qui ouvrent ton profil de pote. */
export function EnTetePotes({ moi, espace, onChoisirEspace }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { nonLus } = utiliserConversations();
  const monId = utiliserMonId();

  return (
    <View className="gap-3 pt-2">
      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          <SelecteurEspaceCommunaute espace={espace} onChoisir={onChoisirEspace} nonLus={nonLus} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un pote"
          accessibilityHint="Par son pseudo, ton lien ou ton QR code"
          onPress={() => {
            vibrerLegerement();
            router.push("/potes/ajouter");
          }}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:opacity-80"
        >
          <Ionicons name="person-add" size={18} color={couleurs.nuit} />
        </Pressable>
      </View>


      {espace === "bande" ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={moi.pseudo ? `Ton profil de pote, @${moi.pseudo}` : "Ton profil de pote"}
          accessibilityHint="Ce que tes potes voient de toi"
          onPress={() => {
            vibrerLegerement();
            router.push({ pathname: "/potes/profil/[id]", params: { id: monId } });
          }}
          className="min-h-11 flex-row items-center gap-2.5 self-start rounded-full border-2 border-encre bg-carte py-1 pl-1 pr-3 active:opacity-80"
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
      ) : null}
    </View>
  );
}
