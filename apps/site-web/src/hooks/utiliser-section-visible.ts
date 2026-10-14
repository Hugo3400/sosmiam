import { useEffect, useState } from "react";

/**
 * La section (parmi `ids`, dans cet ordre) qui passe à hauteur de lecture, un peu au-dessus du milieu de l'écran ; null
 * quand aucune n'y est (le haut de l'accueil, une section non suivie) ou quand `actif` est faux (une autre page).
 * Sert à mettre en valeur le lien de l'en-tête de la section qu'on lit. Rien au rendu serveur.
 */
export function utiliserSectionVisible(ids: readonly string[], actif: boolean): string | null {
  const [visible, setVisible] = useState<string | null>(null);
  const cle = ids.join(" ");

  useEffect(() => {
    if (!actif || typeof IntersectionObserver === "undefined") return;
    const liste = cle.split(" ");
    const elements = liste.map((id) => document.getElementById(id)).filter((element) => element !== null);
    if (elements.length === 0) return;
    const aHauteur = new Set<string>();
    // Une bande de 1 % de la hauteur de l'écran, à 40 % du haut : une seule section la traverse à la fois
    const observateur = new IntersectionObserver(
      (entrees) => {
        for (const entree of entrees) {
          if (entree.isIntersecting) aHauteur.add(entree.target.id);
          else aHauteur.delete(entree.target.id);
        }
        setVisible(liste.find((id) => aHauteur.has(id)) ?? null);
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    for (const element of elements) observateur.observe(element);
    return () => {
      observateur.disconnect();
      setVisible(null);
    };
  }, [cle, actif]);

  return actif ? visible : null;
}
