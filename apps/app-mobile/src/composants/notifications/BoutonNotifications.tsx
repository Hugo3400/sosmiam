import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { INDICE_COMPTE } from "~/contenus/indice-compte";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserNotifications } from "~/hooks/utiliser-notifications";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** « sombre » : posé sur le fil (fond noir transparent, cloche blanche) ; « claire » : rond blanc à bord noir, comme la roue des réglages du Profil */
  variante: "sombre" | "claire";
};

/** Au-delà, la pastille affiche « 9+ » (VoiceOver lit toujours le vrai nombre) */
const MAX_AFFICHE = 9;

/**
 * La cloche : ouvre l'écran Notifications. Sa pastille compte ce qui est arrivé depuis ta dernière visite, plus les demandes
 * d'abonnement qui t'attendent. Lit elle-même notifications et suivis : l'écran qui la pose ne se redessine pas pour elle.
 * En visite sans compte, elle ouvre la feuille « Crée ton compte ».
 */
export function BoutonNotifications({ variante }: Props) {
  const router = useRouter();
  const exiger = utiliserCompteRequis();
  const avecCompte = utiliserProfil().profil !== null;
  const notifications = utiliserNotifications();
  const suivis = utiliserSuivisPersonnes();
  const nombre = (notifications.pret ? notifications.nonVues : 0) + (suivis.pret ? suivis.demandesRecues.length : 0);
  const sombre = variante === "sombre";

  function toucher() {
    vibrerLegerement();
    if (!exiger("suivre")) return;
    router.push("/notifications");
  }

  return (
    <Pressable
      accessibilityRole="button"
      // Commence par le mot que Commande vocale attend (« Toucher Notifications »)
      accessibilityLabel={nombre > 0 ? `Notifications, ${nombre} nouveauté${nombre > 1 ? "s" : ""}` : "Notifications"}
      accessibilityHint={avecCompte ? "Tes abonnés, tes demandes et les nouveautés des comptes que tu suis" : INDICE_COMPTE}
      hitSlop={4}
      onPress={toucher}
      className={`h-11 w-11 items-center justify-center rounded-full active:opacity-70 ${sombre ? "bg-black/30" : "border-2 border-encre bg-white"}`}
    >
      {sombre ? <Ionicons name="notifications-outline" size={22} color="#FFFFFF" /> : <Text className="text-xl">🔔</Text>}
      {nombre > 0 ? (
        <View
          // Décorative : le nombre est déjà dans le libellé du bouton
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 border-encre bg-tomate px-1"
        >
          <Text allowFontScaling={false} className="font-texte-gras text-[11px] leading-[13px] text-white">
            {nombre > MAX_AFFICHE ? `${MAX_AFFICHE}+` : nombre}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
