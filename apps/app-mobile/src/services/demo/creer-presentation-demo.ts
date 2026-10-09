import { DUREE_PRESENTATION_QR_MS, PERSONNES_PRESENTATION_MAX } from "@sos-miam/commun/regles/visites";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";

import type { MagasinDemo, PresentationDemo } from "./types-demo";

/**
 * L'équipe touche « Montrer le QR » pour N personnes (1 à 12) : le QR vit 2 min, ou jusqu'à ce que tout le monde ait
 * scanné. Un seul QR à la fois par lieu : le précédent, s'il était encore affiché, s'éteint.
 */
export function creerPresentationDemo(m: MagasinDemo, lieuId: number, personnes: number, maintenantMs: number, reglement?: ReglementVisite): PresentationDemo {
  const nombre = Math.min(PERSONNES_PRESENTATION_MAX, Math.max(1, Math.floor(personnes) || 1));
  for (const ancienne of m.presentations) if (ancienne.lieuId === lieuId && !ancienne.cachee) ancienne.cachee = true;
  const presentation: PresentationDemo = {
    id: m.prochainId,
    lieuId,
    personnes: nombre,
    restantes: nombre,
    creeLe: new Date(maintenantMs).toISOString(),
    expireLe: new Date(maintenantMs + DUREE_PRESENTATION_QR_MS).toISOString(),
    cachee: false,
    reglement,
  };
  m.prochainId += 1;
  m.presentations.push(presentation);
  return presentation;
}
