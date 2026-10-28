import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { MessageEchecVisite, type ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { TEXTES_SCANNER_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-scanner-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserValidationComptoir } from "~/hooks/utiliser-validation-comptoir";

/**
 * Aperçu web (même rôle que ScannerComptoir.tsx sur téléphone) : pas de caméra, seulement l'explication.
 */
export function ScannerComptoir() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_SCANNER_COMPTOIR_PAR_LANGUE);
  const router = useRouter();
  const fermer = utiliserFermerPile("/scan");
  const marges = useSafeAreaInsets();
  const { preparer, etape, echec, effacerEchec, propsFeuille } = utiliserValidationComptoir();

  const prepare = useRef(false);
  useEffect(() => {
    if (prepare.current) return;
    prepare.current = true;
    preparer().catch(() => {});
  }, [preparer]);

  const messageEtape = etape === "repos" ? null : T.etapes[etape];
  const actionsEchec: ActionEchecVisite[] = echec
    ? [
        ...(echec.erreur === "qr-vitrine" && echec.details?.lieuId !== undefined
          ? [{ libelle: T.voirFiche, onPress: () => router.replace({ pathname: "/lieu/[id]", params: { id: String(echec.details?.lieuId) } }) }]
          : []),
        { libelle: T.reessayer, onPress: effacerEchec, variante: "blanc" as const },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#111111", paddingTop: marges.top + 8, paddingBottom: marges.bottom + 16 }} className="px-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.fermer}
        onPress={() => {
          vibrerLegerement();
          fermer();
        }}
        className="h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-black/40 active:opacity-80"
      >
        <Ionicons name="close" size={24} color="#FFFFFF" />
      </Pressable>
      <View className="flex-1 items-center justify-center gap-5 px-4">
        <View className="h-24 w-24 items-center justify-center rounded-3xl border-2 border-jaune bg-jaune">
          <Ionicons name="qr-code-outline" size={48} color={couleurs.nuit} />
        </View>
        <Text accessibilityRole="header" className="text-center font-titre text-3xl text-white">
          {T.titre}
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-white/80">
          {lierPonctuation(T.apercuWeb)}
        </Text>
        {messageEtape ? (
          <View accessible accessibilityLiveRegion="polite" accessibilityLabel={messageEtape} className="items-center gap-3">
            <ActivityIndicator color={couleurs.jaune} />
            <Text className="text-center font-texte-semi text-sm text-white">{lierPonctuation(messageEtape)}</Text>
          </View>
        ) : null}
      </View>
      {echec ? (
        <View className="rounded-carte border-2 border-encre bg-creme p-4">
          <MessageEchecVisite erreur={echec.erreur} details={echec.details} actions={actionsEchec} />
        </View>
      ) : (
        <View className="gap-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={T.pasDeQr}
            onPress={() => router.replace("/scan/ou-es-tu")}
            className="min-h-11 items-center justify-center active:opacity-60"
          >
            <Text className="font-texte-gras text-[15px] text-white underline">{T.pasDeQr}</Text>
          </Pressable>
        </View>
      )}
      <FeuillePositionVisite {...propsFeuille} />
    </View>
  );
}
