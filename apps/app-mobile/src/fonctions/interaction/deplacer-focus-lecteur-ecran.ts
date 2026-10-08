import { AccessibilityInfo } from "react-native";

type Element = Parameters<typeof AccessibilityInfo.sendAccessibilityEvent>[0];

/** Place le lecteur d'écran (VoiceOver, TalkBack) sur un élément ; sans effet sur le web, où l'outil n'existe pas. */
export function deplacerFocusLecteurEcran(element: Element | null): void {
  if (element && typeof AccessibilityInfo.sendAccessibilityEvent === "function") AccessibilityInfo.sendAccessibilityEvent(element, "focus");
}
