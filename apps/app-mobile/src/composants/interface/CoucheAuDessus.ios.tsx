import type { ReactNode } from "react";
import { FullWindowOverlay } from "react-native-screens";

type Props = {
  /** Un seul élément en position absolue (un bandeau) : le reste de l'écran reste touchable */
  children: ReactNode;
};

/**
 * La couche au-dessus de tout, sur iPhone : une fenêtre posée sur l'app (FullWindowOverlay de react-native-screens), donc
 * aussi au-dessus d'une feuille ouverte (Modal). Elle ne prend que les touchers qui tombent sur son bandeau. À ne monter
 * que le temps du bandeau.
 */
export function CoucheAuDessus({ children }: Props) {
  return <FullWindowOverlay>{children}</FullWindowOverlay>;
}
