import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { PartageEnvoyeMiamSafe } from "~/composants/miam-safe/PartageEnvoyeMiamSafe";
import { PartageRecuMiamSafe } from "~/composants/miam-safe/PartageRecuMiamSafe";
import { utiliserPartageMiamSafe } from "~/hooks/utiliser-partage-miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/** Le partage est relu toutes les 10 s : le pote voit la position bouger, la personne qui partage voit quand il est fini */
const RELECTURE_POTE_MS = 10_000;

/**
 * « Prévenir un pote » (Miam Safe) : l'écran d'un partage de position, ouvert après avoir prévenu un pote (paramètre
 * « telephones » : sur combien de ses téléphones la notification est partie), ou par la notification chez le pote.
 */
export default function EcranPartageMiamSafe() {
  const router = useRouter();
  const { miamSafe } = utiliserServices();
  const params = useLocalSearchParams<{ id: string; telephones?: string }>();
  const id = /^\d{1,9}$/.test(params.id ?? "") ? Number(params.id) : null;
  const telephones = params.telephones !== undefined && /^\d{1,3}$/.test(params.telephones) ? Number(params.telephones) : null;
  const { partage, erreur, relire } = utiliserPartageMiamSafe(id, RELECTURE_POTE_MS);
  const [arret, setArret] = useState(false);

  const arreter = async () => {
    if (id === null || arret) return;
    setArret(true);
    await miamSafe.arreterPartage(id).catch(() => null);
    await relire();
    setArret(false);
  };

  // Ouvert par une notification, l'app n'a pas d'écran d'avant : on revient à l'accueil
  const fermer = () => (router.canGoBack() ? router.back() : router.replace("/"));
  const message = erreur && !partage ? MESSAGES_SERVICE[id === null ? "partage-inconnu" : erreur] : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center justify-between px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          hitSlop={12}
          onPress={fermer}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="close" size={20} color={couleurs.encre} />
        </Pressable>
        <View className="rounded-full bg-encre px-3 py-1">
          <Text className="font-texte-gras text-sm text-jaune">🛡 Miam Safe</Text>
        </View>
      </View>
      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-5 pb-8">
        {partage?.sens === "envoye" ? (
          <>
            <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">Prévenir un pote</Text>
            <PartageEnvoyeMiamSafe partage={partage} telephones={telephones} arret={arret} onArreter={arreter} onTermine={relire} />
          </>
        ) : partage ? (
          <PartageRecuMiamSafe partage={partage} />
        ) : message ? (
          <>
            <View accessible className="gap-2 rounded-2xl border-2 border-dashed border-encre bg-white p-4">
              <Text className="font-texte-gras text-base text-encre">{message.emoji} {message.titre}</Text>
              <Text className="font-texte text-base leading-6 text-encre">{message.texte}</Text>
            </View>
            <NumerosUrgence />
          </>
        ) : (
          <Text className="font-texte text-base text-gris">Un instant…</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
