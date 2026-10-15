import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** Un seul élément en position absolue (un bandeau) : le reste de l'écran reste touchable */
  children: ReactNode;
};

/** Le calque : tout l'écran, devant tout, et transparent aux clics (seul le bandeau, posé dedans, les prend) */
function creerCalque(): HTMLDivElement | null {
  if (typeof document === "undefined") return null;
  const calque = document.createElement("div");
  calque.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;display:flex;flex-direction:column";
  return calque;
}

/**
 * La couche au-dessus de tout, sur le web : un calque ajouté à la fin de la page, devant les feuilles ouvertes (les Modal de
 * react-native-web vivent aussi à la fin de la page). Il laisse passer les clics, sauf sur son bandeau. À ne monter que le
 * temps du bandeau.
 */
export function CoucheAuDessus({ children }: Props) {
  const [calque] = useState(creerCalque);

  useEffect(() => {
    if (!calque) return;
    document.body.appendChild(calque);
    return () => {
      calque.remove();
    };
  }, [calque]);

  return calque ? createPortal(children, calque) : null;
}
