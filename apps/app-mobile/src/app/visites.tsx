import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useMemo, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import type { Visite } from "@sos-miam/commun/types/visite";
import { BarreEtatTheme } from "~/composants/interface/BarreEtatTheme";
import { Bouton } from "~/composants/interface/Bouton";
import { EnTeteMesVisites } from "~/composants/visites/EnTeteMesVisites";
import { LigneVisite } from "~/composants/visites/LigneVisite";
import { MessageLectureRatee } from "~/composants/visites/MessageLectureRatee";
import { TEXTES_MES_VISITES_PAR_LANGUE } from "~/contenus/textes-mes-visites";
import { grouperVisitesParMois } from "~/fonctions/visites/grouper-visites-par-mois";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserLectureListe } from "~/hooks/utiliser-lecture-liste";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVisites } from "~/hooks/utiliser-visites";

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
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MES_VISITES_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const router = useRouter();
  const { source, enCours, visites, rafraichir } = utiliserVisites();
  const lecture = utiliserLectureListe("visites");
  const groupes = useMemo(() => grouperVisitesParMois(visites, langue), [visites, langue]);
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
      const message = messages["service-indisponible"];
      return <CarteMessage emoji={message.emoji} titre={message.titre} texte={message.texte} />;
    }
    if (lecture === "chargement") {
      return (
        <View className="items-center py-10">
          <ActivityIndicator color={couleurs.encre} accessibilityLabel={T.chargement} />
        </View>
      );
    }
    if (lecture === "ratee") {
      return <MessageLectureRatee titre={T.rateeTitre} texte={T.rateeTexte} indice={T.relireIndice} onReessayer={rafraichir} />;
    }
    if (visites.length === 0 && !enCours) {
      return (
        <CarteMessage
          emoji="🍽️"
          texte={T.vide}
          enPlus={<Bouton libelle={T.allerScan} variante="blanc" petit className="mt-2" indice={T.allerScanIndice} onPress={() => router.navigate("/scan")} />}
        />
      );
    }
    return (
      <>
        {validees ? <EnTeteMesVisites visites={visites} /> : null}

        {enCours ? (
          <View className="gap-3">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
              {T.enCours}
            </Text>
            <LigneVisite visite={enCours} onPress={() => ouvrir(enCours)} />
          </View>
        ) : null}

        {groupes.map((groupe) => {
          const nombre = groupe.visites.length;
          return (
            <View key={groupe.mois} className="gap-3">
              <Text accessibilityRole="header" accessibilityLabel={T.moisLu(groupe.titre, nombre)} className="font-titre-gras text-xl text-encre">
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
      <BarreEtatTheme />
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 px-5 pb-10"
        refreshControl={
          source === "indisponible" ? undefined : <RefreshControl refreshing={relecture} onRefresh={() => void relire()} tintColor={couleurs.encre} colors={[couleurs.encre]} progressBackgroundColor={couleurs.carte} />
        }
      >
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-titre text-3xl text-encre">
            {T.titre}
          </Text>
          <Text className="font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.sousTitre)}
          </Text>
        </View>

        {contenu()}
      </ScrollView>
    </SafeAreaView>
  );
}
