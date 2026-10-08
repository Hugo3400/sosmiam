/**
 * Fait défiler la page jusqu'à l'élément `id` et lui donne le focus (clavier, lecteurs d'écran),
 * comme le ferait un lien « #… », mais sans toucher à l'adresse. Renvoie false si l'élément est absent ou caché.
 * Le défilement est doux, sauf si la personne a demandé de réduire les animations.
 */
export function defilerVersElement(id: string): boolean {
  const element = document.getElementById(id);
  if (!element || element.offsetParent === null) return false;
  const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({ behavior: doux ? "smooth" : "auto", block: element.tagName === "DETAILS" ? "center" : "start" });
  if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
  element.focus({ preventScroll: true });
  return true;
}
