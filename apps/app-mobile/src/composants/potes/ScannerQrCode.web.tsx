import { Text, View } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border-2 border-dashed border-ligne bg-carte px-4 py-3">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
        📷
      </Text>
      <Text className="flex-1 font-texte text-sm leading-5 text-gris">
        {lierPonctuation(
          pour === "pote"
            ? "Pas d'appareil photo dans l'aperçu web : le scan marche dans l'app, sur ton téléphone. Ici, colle plutôt le lien de ton pote juste en dessous."
            : "Pas d'appareil photo dans l'aperçu web : le scan marche dans l'app, sur ton téléphone. Ici, colle plutôt le lien du QR juste en dessous.",
        )}
      </Text>
    </View>
  );
}
