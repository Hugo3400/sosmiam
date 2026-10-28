import Ionicons from "@expo/vector-icons/Ionicons";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, ActivityIndicator, Linking, Pressable, Text, useWindowDimensions, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { BoutonLampe } from "~/composants/scan/BoutonLampe";
import { ViseurScan } from "~/composants/scan/ViseurScan";
import { FeuillePositionVisite } from "~/composants/visites/FeuillePositionVisite";
import { MessageEchecVisite, type ActionEchecVisite } from "~/composants/visites/MessageEchecVisite";
import { TEXTES_SCANNER_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-scanner-comptoir";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserMargesPleinEcran } from "~/hooks/utiliser-marges-plein-ecran";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserValidationComptoir } from "~/hooks/utiliser-validation-comptoir";

type Souci = "refuse" | "bloque" | "panne";

// Un code rejeté se relâche au bout de 2 s ; le même texte relu juste après est ignoré (le QR reste devant l'objectif)
const DELAI_RELACHE_MS = 2000;
const DELAI_MEME_TEXTE_MS = 4000;

/**
 * Le scanner du QR du comptoir, en plein écran : la caméra s'allume seule si l'accès est déjà donné (sinon au toucher),
 * s'éteint dès qu'un autre écran passe devant, lit un seul code à la fois, et laisse la validation à utiliserValidationComptoir.
 * Aucune adresse lue dans un QR n'est jamais ouverte.
 */
export function ScannerComptoir() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_SCANNER_COMPTOIR_PAR_LANGUE);
  const MESSAGES: Record<Souci, string> = T.soucis;
  const router = useRouter();
  const fermer = utiliserFermerPile("/scan");
  const marges = utiliserMargesPleinEcran();
  const { width } = useWindowDimensions();
  const [permission, demanderPermission] = useCameraPermissions();
  const [visible, setVisible] = useState(true);
  const [lampe, setLampe] = useState(false);
  const [souci, setSouci] = useState<Souci | null>(null);
  const verrou = useRef(false);
  const dernier = useRef<{ texte: string; quand: number } | null>(null);
  const validation = utiliserValidationComptoir();
  const { preparer, traiterTexte, etape, echec, effacerEchec, propsFeuille } = validation;

  // Un autre écran par-dessus (la visite validée, une fiche) : caméra et lampe coupées
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => {
        setVisible(false);
        setLampe(false);
      };
    }, []),
  );

  // La première fois : la petite explication de la position, avant même de viser
  const prepare = useRef(false);
  useEffect(() => {
    if (prepare.current) return;
    prepare.current = true;
    preparer().catch(() => {});
  }, [preparer]);

  const allumee = visible && permission?.granted === true;
  useEffect(() => {
    if (allumee) AccessibilityInfo.announceForAccessibility(T.cameraPrete);
  }, [allumee, T]);

  async function autoriser() {
    setSouci(null);
    try {
      const reponse = await demanderPermission();
      if (reponse.granted) return;
      const nouveau: Souci = reponse.canAskAgain ? "refuse" : "bloque";
      setSouci(nouveau);
      AccessibilityInfo.announceForAccessibility(MESSAGES[nouveau]);
    } catch {
      setSouci("panne");
      AccessibilityInfo.announceForAccessibility(MESSAGES.panne);
    }
  }

  async function traiter(texte: string) {
    const maintenant = Date.now();
    if (verrou.current || etape !== "repos" || echec) return;
    if (dernier.current && dernier.current.texte === texte && maintenant - dernier.current.quand < DELAI_MEME_TEXTE_MS) return;
    verrou.current = true;
    dernier.current = { texte, quand: maintenant };
    vibrerLegerement();
    try {
      await traiterTexte(texte);
    } finally {
      setTimeout(() => {
        verrou.current = false;
      }, DELAI_RELACHE_MS);
    }
  }

  const lu = (resultat: BarcodeScanningResult) => {
    traiter(resultat.data);
  };

  const actionsEchec: ActionEchecVisite[] = echec
    ? [
        ...(echec.erreur === "qr-vitrine" && echec.details?.lieuId !== undefined
          ? [{ libelle: T.voirFiche, onPress: () => router.replace({ pathname: "/lieu/[id]", params: { id: String(echec.details?.lieuId) } }) }]
          : []),
        ...(echec.erreur === "position-bloquee" ? [{ libelle: T.ouvrirReglages, onPress: () => Linking.openSettings().catch(() => {}) }] : []),
        { libelle: T.reessayer, onPress: effacerEchec, variante: "blanc" as const },
      ]
    : [];

  const taille = Math.min(width * 0.7, 280);
  const occupe = etape !== "repos";
  const messageEtape = etape === "repos" ? null : T.etapes[etape];

  return (
    <View style={{ flex: 1, backgroundColor: "#111111" }}>
      {allumee ? (
        <CameraView
          style={{ position: "absolute", inset: 0 }}
          facing="back"
          enableTorch={lampe}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={occupe || echec ? undefined : lu}
        />
      ) : null}

      {allumee ? (
        <ViseurScan taille={taille} actif={!occupe && !echec}>
          {messageEtape ? (
            <View accessible accessibilityLiveRegion="polite" accessibilityLabel={messageEtape} className="items-center gap-3 rounded-2xl bg-black/70 px-4 py-3">
              <ActivityIndicator color={couleurs.jaune} />
              <Text className="text-center font-texte-semi text-sm text-white">{lierPonctuation(messageEtape)}</Text>
            </View>
          ) : null}
        </ViseurScan>
      ) : (
        <View className="flex-1 items-center justify-center gap-5 px-8">
          <View className="h-24 w-24 items-center justify-center rounded-3xl border-2 border-jaune bg-jaune">
            <Ionicons name="qr-code-outline" size={48} color={couleurs.nuit} />
          </View>
          <Text accessibilityRole="header" className="text-center font-titre text-3xl text-white">
            {T.titre}
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-white/80">
            {lierPonctuation(souci ? MESSAGES[souci] : T.consigne)}
          </Text>
          {souci === "bloque" ? (
            <Bouton libelle={T.ouvrirReglages} onPress={() => Linking.openSettings().catch(() => {})} className="self-stretch" />
          ) : (
            <Bouton libelle={T.allumer} onPress={autoriser} className="self-stretch" />
          )}
        </View>
      )}

      {/* En haut : fermer, et la lampe quand la caméra tourne */}
      <View style={{ position: "absolute", top: marges.top + 8, left: 16, right: 16 }} className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.fermer}
          hitSlop={8}
          onPress={() => {
            vibrerLegerement();
            fermer();
          }}
          className="h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-black/40 active:opacity-80"
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </Pressable>
        {allumee ? <BoutonLampe allumee={lampe} onBasculer={() => setLampe((l) => !l)} /> : null}
      </View>

      {/* En bas : la consigne, l'autre chemin, ou le message d'échec */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: marges.bottom + 16 }} className="gap-4">
        {echec ? (
          <View className="rounded-carte border-2 border-encre bg-creme p-4">
            <MessageEchecVisite erreur={echec.erreur} details={echec.details} actions={actionsEchec} />
          </View>
        ) : (
          <>
            {allumee ? <Text className="text-center font-texte-gras text-lg text-white">{lierPonctuation(T.viser)}</Text> : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={T.pasDeQr}
              hitSlop={8}
              onPress={() => {
                vibrerLegerement();
                router.replace("/scan/ou-es-tu");
              }}
              className="min-h-11 items-center justify-center active:opacity-60"
            >
              <Text className="font-texte-gras text-[15px] text-white underline">{T.pasDeQr}</Text>
            </Pressable>
          </>
        )}
      </View>

      <FeuillePositionVisite {...propsFeuille} />
    </View>
  );
}
