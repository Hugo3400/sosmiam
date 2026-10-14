import { type RefObject, useEffect, useState } from "react";

/**
 * Vrai quand l'en-tête collant est arrivé en haut de l'écran (le bandeau du dessus est passé) : l'en-tête prend alors
 * une ombre légère, pour se détacher de la page qui défile dessous. Faux au rendu serveur.
 */
export function utiliserEnTeteCollee(enTete: RefObject<HTMLElement | null>): boolean {
  const [collee, setCollee] = useState(false);

  useEffect(() => {
    function lire() {
      const element = enTete.current;
      setCollee(element !== null && window.scrollY > 0 && element.getBoundingClientRect().top <= 0);
    }
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    window.addEventListener("resize", lire, { passive: true });
    return () => {
      window.removeEventListener("scroll", lire);
      window.removeEventListener("resize", lire);
    };
  }, [enTete]);

  return collee;
}
