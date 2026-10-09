import { initialWindowMetrics, useSafeAreaInsets, type EdgeInsets } from "react-native-safe-area-context";

/**
 * Marges sûres d'un écran ouvert en plein écran par-dessus les onglets (la pile du Scan). Sur iPhone, ces écrans reçoivent
 * parfois des marges nulles : on garde au moins celles de la fenêtre au lancement (encoche ou Dynamic Island en haut,
 * barre d'accueil en bas), pour que rien ne passe sous l'heure ni sous la barre du bas.
 */
export function utiliserMargesPleinEcran(): EdgeInsets {
  const marges = useSafeAreaInsets();
  const fenetre = initialWindowMetrics?.insets;
  return {
    ...marges,
    top: Math.max(marges.top, fenetre?.top ?? 0),
    bottom: Math.max(marges.bottom, fenetre?.bottom ?? 0),
  };
}
