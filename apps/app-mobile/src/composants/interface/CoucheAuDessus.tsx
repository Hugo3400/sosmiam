import type { ReactNode } from "react";

type Props = {
  /** Un seul élément en position absolue (un bandeau) : le reste de l'écran reste touchable */
  children: ReactNode;
};

/**
 * Une couche au-dessus de tout l'écran, pour un bandeau de toute l'app (AnnonceCompteLimite). Sur Android, elle reste dans
 * la page : une feuille ouverte (Modal, une autre fenêtre) passe par-dessus ; AnnonceCompteLimite dit alors sa phrase par un
 * toast du système et attend la fermeture de la feuille pour compter ses secondes.
 * iPhone : CoucheAuDessus.ios.tsx (au-dessus des feuilles) ; web : CoucheAuDessus.web.tsx.
 */
export function CoucheAuDessus({ children }: Props) {
  return <>{children}</>;
}
