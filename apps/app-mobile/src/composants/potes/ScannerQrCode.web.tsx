import { Text, View } from "react-native";

import { TEXTES_AJOUT_POTE_PAR_LANGUE } from "~/contenus/textes-ajout-pote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

// Même contrat que ScannerQrCode.tsx (iPhone et Android) : à garder identique
type Props = {
  /** Texte lu dans le QR code (un lien d'invitation, normalement) ; l'appareil photo s'éteint aussitôt */
  onLu: (texte: string) => void;
  /** Le scan s'ouvre (pour effacer le résultat d'avant) */
  onOuvrir?: () => void;
  /** Ce qu'on scanne : le QR code d'un pote (par défaut) ou celui d'un appareil à connecter au compte */
  pour?: "pote" | "appareil";
};

/**
 * Aperçu web : pas d'appareil photo ici (expo-camera n'est jamais chargé). Metro prend ce fichier à la place de ScannerQrCode.tsx sur le web ;
 * l'écran garde le champ pour coller le lien d'un pote.
 */
export function ScannerQrCode({ pour = "pote" }: Props) {
  const T = utiliserTextes(TEXTES_AJOUT_POTE_PAR_LANGUE).scanner;
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-ligne bg-carte px-4 py-3">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
        📷
      </Text>
      <Text className="flex-1 font-texte text-sm leading-5 text-gris">
        {lierPonctuation(T[pour].web)}
      </Text>
    </View>
  );
}
