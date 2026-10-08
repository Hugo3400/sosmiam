import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BoutonSimulerScan } from "~/composants/scan/BoutonSimulerScan";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { MessageEchecVisite, type ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserValidationComptoir } from "~/hooks/utiliser-validation-comptoir";
import couleurs from "~/theme/couleurs";

const ETAPES = {
  position: "On vérifie que tu es bien chez eux…",
  envoi: "On valide ta visite…",
  "nouvel-essai": "Pas de réseau : on réessaie tout seul pendant une minute…",
} as const;

/**
 * Aperçu web (même rôle que ScannerComptoir.tsx sur téléphone) : pas de caméra, seulement l'explication et, en démo,
 * le scan simulé, qui suit le même chemin qu'un vrai scan. C'est le chemin des tests automatiques.
 */
export function ScannerComptoir() {
  const router = useRouter();
  const fermer = utiliserFermerPile("/scan");
  const marges = useSafeAreaInsets();
  const { preparer, traiterTexte, etape, echec, effacerEchec, propsFeuille } = utiliserValidationComptoir();

  const prepare = useRef(false);
  useEffect(() => {
    if (prepare.current) return;
    prepare.current = true;
    preparer().catch(() => {});
  }, [preparer]);

  const messageEtape = etape === "repos" ? null : ETAPES[etape];
  const actionsEchec: ActionEchecVisite[] = echec
    ? [
        ...(echec.erreur === "qr-vitrine" && echec.details?.lieuId !== undefined
          ? [{ libelle: "Voir la fiche", onPress: () => router.replace({ pathname: "/lieu/[id]", params: { id: String(echec.details?.lieuId) } }) }]
          : []),
        { libelle: "Réessayer", onPress: effacerEchec, variante: "blanc" as const },
      ]
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#111111", paddingTop: marges.top + 8, paddingBottom: marges.bottom + 16 }} className="px-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Fermer le scanner"
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
          <Ionicons name="qr-code-outline" size={48} color={couleurs.encre} />
        </View>
        <Text accessibilityRole="header" className="text-center font-titre text-3xl text-white">
          Scanner le QR du comptoir
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-white/80">
          {lierPonctuation("Sur l'aperçu web, pas d'appareil photo : le scan se fait depuis ton téléphone.")}
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
          <BoutonSimulerScan onTexte={(texte) => traiterTexte(texte)} desactive={etape !== "repos"} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Pas de QR ? Demande l'addition"
            onPress={() => router.replace("/scan/ou-es-tu")}
            className="min-h-11 items-center justify-center active:opacity-60"
          >
            <Text className="font-texte-gras text-[15px] text-white underline">Pas de QR ? Demande l'addition</Text>
          </Pressable>
        </View>
      )}
      <FeuillePositionVisite {...propsFeuille} />
    </View>
  );
}
