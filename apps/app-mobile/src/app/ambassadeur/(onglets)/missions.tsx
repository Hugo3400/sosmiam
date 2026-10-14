import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MissionAmbassadeur } from "@sos-miam/commun/types/espace-ambassadeur";
import { CarteMission } from "~/composants/ambassadeur/CarteMission";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

/** Les missions confiées par l'équipe : à faire d'abord (échéance la plus proche), puis faites ou annulées. */
export default function EcranMissions() {
  const router = useRouter();
  const { ambassadeur } = utiliserServices();
  const [missions, setMissions] = useState<MissionAmbassadeur[] | null>(null);
  const [echec, setEchec] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      ambassadeur.listerMissions().then((r) => {
        if (!actif) return;
        if (r.ok) setMissions(r.missions);
        else setEchec(decrireEchecVisite(r.erreur, r.details).texte);
      });
      return () => {
        actif = false;
      };
    }, [ambassadeur]),
  );

  const aFaire = (missions ?? []).filter((m) => m.statut === "a-faire").sort((a, b) => (a.echeance ?? "9999").localeCompare(b.echeance ?? "9999"));
  const autres = (missions ?? []).filter((m) => m.statut !== "a-faire").sort((a, b) => (b.faiteLe ?? b.creeLe).localeCompare(a.faiteLe ?? a.creeLe));
  const ouvrir = (id: number) => router.push({ pathname: "/ambassadeur/mission/[id]", params: { id: String(id) } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-3">
        <EnTeteMode mode="ambassadeur" titre="Missions" sousTitre="Ce que l'équipe te confie, près de chez toi" />
        {echec ? (
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
        ) : missions === null ? (
          <ActivityIndicator color={couleurs.encre} />
        ) : (
          <>
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">{`À faire${aFaire.length ? ` (${aFaire.length})` : ""}`}</Text>
            {aFaire.length === 0 ? (
              <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Rien pour l'instant : profite, l'équipe te fait signe dès qu'un lieu a besoin de toi.")}</Text>
            ) : (
              <View className="gap-3">{aFaire.map((m) => <CarteMission key={m.id} mission={m} onPress={() => ouvrir(m.id)} />)}</View>
            )}
            {autres.length > 0 ? (
              <>
                <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">Faites</Text>
                <View className="gap-3">{autres.map((m) => <CarteMission key={m.id} mission={m} onPress={() => ouvrir(m.id)} />)}</View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
