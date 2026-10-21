import { useWindowDimensions } from "react-native";

const HAUTEUR_MIN = 480;

export function utiliserTitreDansPoignee() {
  const { height, fontScale } = useWindowDimensions();
  return height / fontScale >= HAUTEUR_MIN;
}
