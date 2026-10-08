import { View } from "react-native";

type Props = {
  /** Avancée, de 0 à 1 */
  avancee: number;
  /** Ce que mesure la jauge, lu par le lecteur d'écran (sans libellé, la jauge est décorative : le texte à côté suffit) */
  libelle?: string;
  /** Valeur lue, par exemple « 2 points sur 100 » */
  texteValeur?: string;
  className?: string;
};

/** Jauge de progression SOS Miam : bord noir, remplissage tomate. */
export function Jauge({ avancee, libelle, texteValeur, className = "" }: Props) {
  const pourcentage = Math.round(Math.min(1, Math.max(0, avancee)) * 100);
  return (
    <View
      accessible={libelle !== undefined}
      accessibilityElementsHidden={libelle === undefined}
      importantForAccessibility={libelle === undefined ? "no-hide-descendants" : "yes"}
      accessibilityRole={libelle !== undefined ? "progressbar" : undefined}
      accessibilityLabel={libelle}
      accessibilityValue={libelle !== undefined ? { min: 0, max: 100, now: pourcentage, text: texteValeur } : undefined}
      className={`h-3 overflow-hidden rounded-full border-2 border-encre bg-white ${className}`}
    >
      <View className="h-full rounded-full bg-tomate" style={{ width: `${pourcentage}%` }} />
    </View>
  );
}
