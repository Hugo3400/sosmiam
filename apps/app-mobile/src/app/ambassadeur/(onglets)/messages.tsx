import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MessageAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserServices } from "~/hooks/utiliser-services";

/** Les messages de l'équipe SOS Miam, le plus récent d'abord : ouvrir un message le marque lu. */
export default function EcranMessagesAmbassadeur() {
  const couleurs = utiliserCouleurs();
  const { ambassadeur } = utiliserServices();
  const [messages, setMessages] = useState<MessageAmbassadeur[] | null>(null);
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [echec, setEchec] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      ambassadeur.listerMessages().then((r) => {
        if (!actif) return;
        if (r.ok) setMessages([...r.messages].sort((a, b) => b.creeLe.localeCompare(a.creeLe)));
        else setEchec(decrireEchecVisite(r.erreur, r.details).texte);
      });
      return () => {
        actif = false;
      };
    }, [ambassadeur]),
  );

  function ouvrir(m: MessageAmbassadeur) {
    setOuvert((id) => (id === m.id ? null : m.id));
    if (m.luLe !== null) return;
    setMessages((liste) => liste?.map((x) => (x.id === m.id ? { ...x, luLe: new Date().toISOString() } : x)) ?? null);
    void ambassadeur.marquerLu(m.id);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-3">
        <EnTeteMode mode="ambassadeur" titre="Messages" sousTitre="Les nouvelles de l'équipe SOS Miam" />
        {echec ? (
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
        ) : messages === null ? (
          <ActivityIndicator color={couleurs.encre} />
        ) : messages.length === 0 ? (
          <Text className="font-texte text-base leading-6 text-gris">Pas encore de message : l'équipe t'écrira ici.</Text>
        ) : (
          <View className="gap-3">
            {messages.map((m) => {
              const nonLu = m.luLe === null;
              return (
                <Pressable
                  key={m.id}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: ouvert === m.id }}
                  accessibilityLabel={`${nonLu ? "Non lu : " : ""}${m.titre}, ${ecrireJourLong(m.creeLe)}`}
                  onPress={() => ouvrir(m)}
                  className={`gap-2 rounded-carte border-2 border-encre p-4 active:opacity-80 ${nonLu ? "bg-jaune" : "bg-carte"}`}
                >
                  <View className="flex-row items-center gap-2">
                    <Text className={`flex-1 font-texte-gras text-base ${nonLu ? "text-nuit" : "text-encre"}`}>{`${nonLu ? "📬 " : ""}${m.titre}`}</Text>
                    <Text className={`font-texte text-xs ${nonLu ? "text-nuit/70" : "text-encre/70"}`}>{ecrireJourLong(m.creeLe).split(" ").slice(1).join(" ")}</Text>
                  </View>
                  {ouvert === m.id ? <Text className={`font-texte text-[15px] leading-[22px] ${nonLu ? "text-nuit" : "text-encre"}`}>{lierPonctuation(m.texte)}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
