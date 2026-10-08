import { useEffect } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router";

import { decoderAncre } from "~/fonctions/navigation/decoder-ancre";
import { defilerVersElement } from "~/fonctions/navigation/defiler-vers-element";

/** Ancre demandée lors d'une navigation (lue par les pages, par exemple la FAQ). */
export type EtatAncre = { ancre?: string };

/**
 * Liens vers une section (« /#adresses », « #inscription », « /faq#faq-prix ») sans « # » dans l'adresse.
 * Un clic passe l'ancre dans l'état de navigation au lieu de l'URL ; une adresse arrivée avec « #… »
 * (lien partagé) est nettoyée. Les liens gardent leur href « #… » : ils marchent aussi sans JavaScript.
 */
export function utiliserAncresSansDiese() {
  const navigate = useNavigate();
  const location = useLocation();
  const typeNavigation = useNavigationType();

  useEffect(() => {
    function intercepterClic(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const lien = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(lien instanceof HTMLAnchorElement) || lien.target === "_blank" || lien.hasAttribute("download")) return;
      const url = new URL(lien.href);
      if (url.origin !== window.location.origin || !url.hash) return;
      e.preventDefault();
      const memePage = url.pathname === window.location.pathname;
      navigate(`${url.pathname}${url.search}`, {
        state: { ancre: decoderAncre(url.hash.slice(1)) } satisfies EtatAncre,
        replace: memePage,
        preventScrollReset: memePage,
      });
    }
    document.addEventListener("click", intercepterClic);
    return () => document.removeEventListener("click", intercepterClic);
  }, [navigate]);

  // Adresse arrivée avec « #… » : on garde l'ancre, mais sans « # » dans l'URL
  useEffect(() => {
    if (!location.hash) return;
    navigate(`${location.pathname}${location.search}`, {
      state: { ancre: decoderAncre(location.hash.slice(1)) } satisfies EtatAncre,
      replace: true,
      preventScrollReset: true,
    });
  }, [location.hash, location.pathname, location.search, navigate]);

  // Ancre demandée : on défile jusqu'à la section (une fois la page affichée).
  // Pas au retour arrière ni au rechargement (POP) : ScrollRestoration remet alors la position d'avant.
  const ancre = (location.state as EtatAncre | null)?.ancre;
  useEffect(() => {
    if (!ancre || typeNavigation === "POP") return;
    const image = requestAnimationFrame(() => defilerVersElement(ancre));
    return () => cancelAnimationFrame(image);
  }, [ancre, location.key, typeNavigation]);
}
