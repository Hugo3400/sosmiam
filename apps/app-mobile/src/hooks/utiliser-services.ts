import { createContext, useContext } from "react";

import type { Services } from "@sos-miam/commun/client-api/services";
import type { OutilsDemo } from "~/services/demo/types-demo";

export type ValeurServices = { services: Services; outilsDemo: OutilsDemo | null };

export const ContexteServices = createContext<ValeurServices | null>(null);

function utiliserValeurServices(nom: string): ValeurServices {
  const valeur = useContext(ContexteServices);
  if (!valeur) throw new Error(`${nom} doit être appelé sous <FournisseurServices>.`);
  return valeur;
}

/**
 * Les services des visites, de la fidélité, des réservations, des avis, du comptoir et de l'espace ambassadeur
 * (démo locale en développement, « indisponibles » dans une version publiée, l'API plus tard), fournis par FournisseurServices.
 */
export function utiliserServices(): Services {
  return utiliserValeurServices("utiliserServices").services;
}

/** Les outils de la démo (scan simulé, réponse du lieu, remise à zéro) ; null hors démo. */
export function utiliserOutilsDemo(): OutilsDemo | null {
  return utiliserValeurServices("utiliserOutilsDemo").outilsDemo;
}
