import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { FeuilleNouveauMessage } from "~/composants/chat/FeuilleNouveauMessage";
import { LigneConversation } from "~/composants/chat/LigneConversation";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

/** Messages : tes conversations privées et de groupe, la plus récente d'abord, et de quoi en lancer une nouvelle. */
export default function Messages() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { pret, conversations, nonLus } = utiliserConversations();
  const { pret: communautePrete, potes } = utiliserCommunaute();
  const [feuilleOuverte, setFeuilleOuverte] = useState(false);
  const [maintenant, setMaintenant] = useState(() => new Date());

  // L'heure tourne : « 14h32 » devient « Hier » sans quitter l'écran
  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 60_000);
    return () => clearInterval(minuterie);
  }, []);

  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const pretes = pret && communautePrete;

  const actions = [
    { cle: "message", libelle: "Nouveau message", icone: "create" as const, fond: "bg-jaune", indice: "Écris à un pote de ta bande", faire: () => setFeuilleOuverte(true) },
    { cle: "groupe", libelle: "Nouveau groupe", icone: "people" as const, fond: "bg-white", indice: "Pour discuter à plusieurs", faire: () => router.push("/potes/nouveau-groupe") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={retour}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      {/* Le temps de lire les conversations sur le téléphone (sinon la démo de départ clignoterait) */}
      {pretes ? (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          contentContainerClassName="px-5"
          contentContainerStyle={{ paddingBottom: marges.bottom + 24 }}
          renderItem={({ item }) => <LigneConversation conversation={item} maintenant={maintenant} />}
          ListHeaderComponent={
            <View className="gap-4 pb-3">
              <View>
                <Text
                  accessibilityRole="header"
                  accessibilityLabel={nonLus > 0 ? `Messages, ${nonLus} non lu${nonLus > 1 ? "s" : ""}` : "Messages"}
                  className="font-titre text-[32px] leading-[36px] text-encre"
                >
                  Messages
                </Text>
                <Text className="mt-2 font-texte text-base leading-6 text-gris">
                  {lierPonctuation("En privé ou en groupe, avec ta bande. Les meilleurs plans miam commencent par un « t'as faim ? ».")}
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2.5">
                {actions.map((a) => (
                  <Pressable
                    key={a.cle}
                    accessibilityRole="button"
                    accessibilityLabel={a.libelle}
                    accessibilityHint={a.indice}
                    onPress={() => {
                      vibrerLegerement();
                      a.faire();
                    }}
                    className={`min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-encre px-4 active:opacity-80 ${a.fond}`}
                  >
                    <Ionicons name={a.icone} size={16} color={couleurs.encre} />
                    <Text className="font-texte-gras text-[15px] text-encre">{a.libelle}</Text>
                  </Pressable>
                ))}
              </View>
              <BandeauDemoPotes />
            </View>
          }
          ListEmptyComponent={
            <View className="mt-2 items-center gap-3 rounded-carte border-2 border-dashed border-ligne px-6 py-8">
              <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-4xl">
                💬
              </Text>
              <Text className="text-center font-texte-gras text-base text-encre">Pas encore de discussion</Text>
              <Text className="text-center font-texte text-base leading-6 text-gris">
                {lierPonctuation(
                  potes.length > 0
                    ? "Ta messagerie est plus calme qu'une cuisine à 16h. Écris à un pote ou monte un groupe : le prochain resto se décide ici."
                    : "Ajoute d'abord un pote ou deux : parler tout seul, ça marche moins bien par écrit.",
                )}
              </Text>
              {potes.length === 0 ? <Bouton libelle="Ajouter un pote" variante="blanc" petit onPress={() => router.push("/potes/ajouter")} /> : null}
            </View>
          }
          ListFooterComponent={
            <Text
              accessibilityLabel="Seuls les membres d'une conversation la voient. Un souci ? Appui long sur un message pour le signaler."
              className="mt-6 text-center font-texte text-[13px] leading-[18px] text-gris"
            >
              {lierPonctuation("🔒 Seuls les membres d'une conversation la voient. Un souci ? Appui long sur un message pour le signaler.")}
            </Text>
          }
        />
      ) : (
        <View className="flex-1" />
      )}

      <FeuilleNouveauMessage visible={feuilleOuverte} onFermer={() => setFeuilleOuverte(false)} />
    </SafeAreaView>
  );
}
