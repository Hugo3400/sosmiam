import { useEffect, useState } from "react";

import { defilerVersElement } from "~/fonctions/navigation/defiler-vers-element";

/** Hauteur défilée à partir de laquelle le bouton apparaît */
const SEUIL = 900;

/**
 * Petit bouton « Haut de page » en bas à droite des pages légales, qui apparaît une fois qu'on a bien défilé.
 * Il remonte au titre de la page et lui donne le focus (clavier, lecteurs d'écran). Sans JavaScript, il reste caché.
 */
export function BoutonHautDePage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mettreAJour = () => setVisible(window.scrollY > SEUIL);
    mettreAJour();
    window.addEventListener("scroll", mettreAJour, { passive: true });
    return () => window.removeEventListener("scroll", mettreAJour);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={() => defilerVersElement("haut")}
      className="fixed right-4 bottom-4 z-20 inline-flex items-center gap-1.5 rounded-full border-2 border-encre bg-white px-3 py-2 text-sm font-semibold shadow-brut-petit hover:bg-jaune-clair md:right-6 md:bottom-6"
    >
      <span aria-hidden="true">↑</span> Haut de page
    </button>
  );
}
