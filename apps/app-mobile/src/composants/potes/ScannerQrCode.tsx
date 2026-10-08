import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AccessibilityInfo, Linking, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Même contrat que ScannerQrCode.web.tsx (aperçu web) : à garder identique
type Props = {
  /** Texte lu dans le QR code (un lien d'invitation, normalement) ; l'appareil photo s'éteint aussitôt */
  onLu: (texte: string) => void;
  /** Le scan s'ouvre (pour effacer le résultat d'avant) */
  onOuvrir?: () => void;
};

type Souci = "refuse" | "bloque" | "panne";

const MESSAGES: Record<Souci, string> = {
  refuse: "Sans l'appareil photo, pas de scan. Pas de souci : retouche « Scanner » si tu changes d'avis, ou colle le lien de ton pote juste en dessous.",
  bloque: "L'appareil photo est coupé pour SOS Miam. Tu peux l'autoriser dans les réglages de ton téléphone, ou coller le lien de ton pote juste en dessous.",
  panne: "L'appareil photo n'a pas voulu s'allumer. Réessaie dans un instant, ou colle le lien de ton pote juste en dessous.",
};

/**
 * Scanner le QR code d'un pote : l'autorisation de l'appareil photo est demandée seulement quand on touche « Scanner »,
 * un refus est accueilli gentiment (avec le chemin des réglages s'il faut), et la caméra s'éteint dès qu'un code est lu
 * ou qu'un autre écran passe devant (profil d'un pote, tes infos…).
 */
export function ScannerQrCode({ onLu, onOuvrir }: Props) {
  const [permission, demanderPermission] = useCameraPermissions();
  const [ouvert, setOuvert] = useState(false);
  const [souci, setSouci] = useState<Souci | null>(null);
  // Un QR code passe plusieurs fois devant l'objectif : seule la première lecture compte
  const dejaLu = useRef(false);

  // Un écran poussé par-dessus laisse celui-ci monté : sans ça, l'appareil photo resterait allumé (et le scan branché) derrière
  useFocusEffect(useCallback(() => () => setOuvert(false), []));

  function signaler(nouveau: Souci) {
    setSouci(nouveau);
    AccessibilityInfo.announceForAccessibility(MESSAGES[nouveau]);
  }

  async function ouvrir() {
    setSouci(null);
    onOuvrir?.();
    if (!permission?.granted) {
      try {
        const reponse = await demanderPermission();
        if (!reponse.granted) return signaler(reponse.canAskAgain ? "refuse" : "bloque");
      } catch {
        return signaler("panne");
      }
    }
    dejaLu.current = false;
    setOuvert(true);
  }

  function lire(resultat: BarcodeScanningResult) {
    if (dejaLu.current) return;
    dejaLu.current = true;
    vibrerLegerement();
    setOuvert(false);
    onLu(resultat.data);
  }

  if (ouvert) {
    return (
      <View className="gap-3">
        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Viseur de l'appareil photo : vise le QR code de ton pote, il sera lu tout seul"
          className="overflow-hidden rounded-carte border-2 border-encre bg-encre"
        >
          {/* Pas de className sur CameraView (vue native) : sa taille passe par style */}
          <CameraView
            style={{ width: "100%", aspectRatio: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={lire}
            onMountError={() => {
              setOuvert(false);
              signaler("panne");
            }}
          />
          {/* Le cadre où placer le code */}
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-3/5 w-3/5 rounded-3xl border-4 border-jaune" />
          </View>
        </View>
        <Text className="text-center font-texte text-sm text-gris">Vise le QR code de ton pote, on s'occupe du reste.</Text>
        <Bouton libelle="Arrêter le scan" variante="blanc" petit onPress={() => setOuvert(false)} />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <Bouton libelle="Scanner un QR code" indice="Allume l'appareil photo pour lire le QR code d'un pote" onPress={() => void ouvrir()} />
      {souci ? (
        <View className="gap-3 rounded-2xl border-2 border-ligne bg-white px-4 py-3">
          <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(MESSAGES[souci])}</Text>
          {souci === "bloque" ? (
            <Bouton libelle="Ouvrir les réglages" variante="blanc" petit onPress={() => Linking.openSettings().catch(() => signaler("panne"))} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
