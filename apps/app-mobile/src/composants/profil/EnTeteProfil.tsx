import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import type { Profil } from "@sos-miam/commun/types/profil";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import type { Avatar } from "~/stockage/avatar-local";
import couleurs from "~/theme/couleurs";

type Props = {
  profil: Profil;
  avatar: Avatar;
  age: number;
};

const TAILLE_AVATAR = 88;

/** Le haut du profil, façon réseau social : l'avatar à toucher pour le changer, ton nom, ta ville et ton âge, et la roue des réglages. */
export function EnTeteProfil({ profil, avatar, age }: Props) {
  const router = useRouter();
  const nomComplet = profil.nom ? `${profil.prenom} ${profil.nom}` : profil.prenom;

  return (
    <View className="items-center gap-1 pt-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Réglages"
        accessibilityHint="Tes infos, tes envies et tes notifications"
        onPress={() => {
          vibrerLegerement();
          router.push("/reglages");
        }}
        className="absolute right-0 top-0 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-70"
      >
        <Text className="text-xl">⚙️</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Changer ton avatar"
        onPress={() => {
          vibrerLegerement();
          router.push("/reglages/avatar");
        }}
        className="mb-2 active:opacity-80"
      >
        <ImageAvatar avatar={avatar} taille={TAILLE_AVATAR} />
        {/* Petit crayon : l'avatar se change d'un toucher */}
        <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-encre bg-jaune">
          <Ionicons name="pencil" size={14} color={couleurs.encre} />
        </View>
      </Pressable>

      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {nomComplet}
      </Text>
      <Text accessibilityLabel={`${profil.ville}, ${age} ans`} className="text-center font-texte text-base text-gris">
        📍 {profil.ville} · {age} ans
      </Text>
    </View>
  );
}
