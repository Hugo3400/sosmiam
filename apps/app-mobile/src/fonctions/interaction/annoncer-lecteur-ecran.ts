import { AccessibilityInfo, Platform } from "react-native";

/**
 * Fait dire une phrase à VoiceOver ou TalkBack (rien si aucun lecteur d'écran n'est allumé). Sur iPhone, la phrase passe
 * après ce qu'il est en train de lire, au lieu de le couper.
 */
export function annoncerLecteurEcran(texte: string): void {
  if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
  else AccessibilityInfo.announceForAccessibility(texte);
}
