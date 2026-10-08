import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { Visite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { BandeauDemoVisites } from "~/composants/scan/BandeauDemoVisites";
import { EnTeteMesVisites } from "~/composants/visites/EnTeteMesVisites";
import { LigneVisite } from "~/composants/visites/LigneVisite";
import { grouperVisitesParMois } from "~/fonctions/visites/grouper-visites-par-mois";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserVisites } from "~/hooks/utiliser-visites";
import couleurs from "~/theme/couleurs";

const TEXTE_VIDE =
  "Aucune visite validée pour l'instant. La prochaine fois que tu manges quelque part, demande l'addition dans l'app : c'est là que la magie opère.";

/** Une carte d'explication au milieu de l'écran (rien à montrer, ou pas encore de comptes) */
function CarteMessage({ emoji, titre, texte, enPlus }: { emoji: string; titre?: string; texte: string; enPlus?: ReactNode }) {
  return (
    <View className="items-center gap-3 rounded-carte border-2 border-dashed border-gris/40 px-6 py-8">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
        {emoji}
      </Text>
      {titre ? (
        <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
          {lierPonctuation(titre)}
        </Text>
      ) : null}
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(texte)}</Text>
      {enPlus}
    </View>
  );
}

/**
 * Mes visites (depuis le Scan ou le Profil) : le résumé (visites, lieux, villes), la demande en cours s'il y en a une,
 * puis toutes tes visites rangées par mois. Toucher une visite l'ouvre (code, célébration, refus et « C'est une erreur ? »).
 * Tirer vers le bas relit tout. Sans comptes (version publiée sans API) : « Ça arrive avec les comptes ».
 */
export default function MesVisites() {
  const router = useRouter();
  const { pret, source, enCours, visites, rafraichir } = utiliserVisites();
  const groupes = useMemo(() => grouperVisitesParMois(visites), [visites]);
  const [relecture, setRelecture] = useState(false);
  const validees = visites.some((v) => v.statut === "validee");

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/scan"));
  const ouvrir = (visite: Visite) => router.push({ pathname: "/visite/[id]", params: { id: String(visite.id) } });

  async function relire() {
    setRelecture(true);
    try {
      await rafraichir();
    } finally {
      setRelecture(false);
    }
  }

  const contenu = () => {
    if (source === "indisponible") {
      const message = MESSAGES_SERVICE["service-indisponible"];
      return <CarteMessage emoji={message.emoji} titre={message.titre} texte={message.texte} />;
    }
    if (!pret) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel="On rassemble tes visites…" />
        </View>
      );
    }
    if (visites.length === 0 && !enCours) {
      return (
        <CarteMessage
          emoji="🍽️"
          texte={TEXTE_VIDE}
          enPlus={<Bouton libelle="Aller à l'onglet Scan" variante="blanc" petit className="mt-2" indice="Ouvre l'onglet Scan" onPress={() => router.navigate("/scan")} />}
        />
      );
    }
    return (
      <>
        {validees ? <EnTeteMesVisites visites={visites} /> : null}

        {enCours ? (
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              En cours
            </Text>
            <LigneVisite visite={enCours} onPress={() => ouvrir(enCours)} />
          </View>
        ) : null}

        {groupes.map((groupe) => {
          const nombre = groupe.visites.length;
          return (
            <View key={groupe.mois} className="gap-3">
              <Text accessibilityRole="header" accessibilityLabel={`${groupe.titre}, ${nombre} visite${nombre > 1 ? "s" : ""}`} className="font-titre-gras text-xl text-encre">
                {groupe.titre}
              </Text>
              <View className="gap-2">
                {groupe.visites.map((visite) => (
                  <LigneVisite key={visite.id} visite={visite} onPress={() => ouvrir(visite)} />
                ))}
              </View>
            </View>
          );
        })}
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-10"
        refreshControl={
          source === "indisponible" ? undefined : <RefreshControl refreshing={relecture} onRefresh={() => void relire()} tintColor={couleurs.encre} colors={[couleurs.encre]} />
        }
      >
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
            Mes visites
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation("Ton carnet de bonnes adresses, mois par mois. Les jours et les heures ne sont visibles que par toi.")}
          </Text>
        </View>

        {source === "demo" ? <BandeauDemoVisites /> : null}

        {contenu()}
      </ScrollView>
    </SafeAreaView>
  );
}
