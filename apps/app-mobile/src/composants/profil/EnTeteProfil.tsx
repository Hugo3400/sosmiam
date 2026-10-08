import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Profil } from "@sos-miam/commun/types/profil";
import { BoutonNotifications } from "~/composants/notifications/BoutonNotifications";
import { ImageAvatar } from "~/composants/profil/ImageAvatar";
import { CompteursSuivi } from "~/composants/suivi/CompteursSuivi";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import type { Avatar } from "~/stockage/avatar-local";
import couleurs from "~/theme/couleurs";

type Props = {
  profil: Profil;
  avatar: Avatar;
  age: number;
};

const TAILLE_AVATAR = 88;

/**
 * Le haut du profil, façon réseau social : la cloche des notifications et la roue des réglages, l'avatar à toucher pour le
 * changer, ton nom et ton @pseudo (avec « 🔒 Privé » si ton compte l'est), ta ville et ton âge, puis tes abonnés et abonnements.
 */
export function EnTeteProfil({ profil, avatar, age }: Props) {
  const router = useRouter();
  const { pret, comptePrive } = utiliserSuivisPersonnes();
  const nomComplet = profil.nom ? `${profil.prenom} ${profil.nom}` : profil.prenom;
  const prive = pret && comptePrive;

  return (
    <View className="items-center gap-1 pt-2">
      <View className="absolute left-0 top-0">
        <BoutonNotifications variante="claire" />
      </View>
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
      {profil.pseudo || prive ? (
        <View className="flex-row flex-wrap items-center justify-center gap-2">
          {profil.pseudo ? <Text className="text-center font-texte-semi text-base text-encre">@{profil.pseudo}</Text> : null}
          {prive ? (
            <View accessible accessibilityLabel="Compte privé" className="rounded-full border-2 border-encre bg-jaune-clair px-2.5 py-0.5">
              <Text className="font-texte-gras text-xs text-encre">🔒 Privé</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text accessibilityLabel={`${profil.ville}, ${age} ans`} className="text-center font-texte text-base text-gris">
        📍 {profil.ville} · {age} ans
      </Text>
      <CompteursSuivi id={ID_MOI} />
    </View>
  );
}
