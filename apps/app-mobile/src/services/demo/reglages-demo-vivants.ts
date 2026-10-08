// Réglages des Coulisses de la démo, gardés ici hors de React : le faux serveur les lit à chaque demande (sans attendre),
// les écrans s'y abonnent (utiliserReglagesDemo). Lus une fois sur le téléphone, au premier usage ; tout coupé en attendant.
import type { Desabonner } from "@sos-miam/commun/client-api/reponse-api";

import {
  effacerReglagesDemo,
  enregistrerReglagesDemo,
  lireReglagesDemoEnregistres,
  REGLAGES_DEMO_DEFAUT,
} from "~/stockage/reglages-demo";

import type { PepinDemo, ReglagesDemo } from "./types-demo";

let reglages: ReglagesDemo = REGLAGES_DEMO_DEFAUT;
let lecture: Promise<void> | null = null;
const ecouteurs = new Set<() => void>();

function prevenir() {
  ecouteurs.forEach((ecouteur) => {
    try {
      ecouteur();
    } catch {
      // Un écran qui plante ne doit pas priver les autres de la nouvelle
    }
  });
}

function lancerLecture(): Promise<void> {
  if (!lecture) {
    lecture = lireReglagesDemoEnregistres()
      .then((lu) => {
        if (!lu) return;
        reglages = lu;
        prevenir();
      })
      .catch(() => {});
  }
  return lecture;
}

/** Les réglages en cours (toujours le même objet tant que rien ne change : utilisable avec useSyncExternalStore). */
export function lireReglagesDemo(): ReglagesDemo {
  void lancerLecture();
  return reglages;
}

/** Change un ou plusieurs réglages, prévient les écrans et garde le choix sur le téléphone. */
export async function changerReglagesDemo(p: Partial<ReglagesDemo>): Promise<void> {
  await lancerLecture();
  reglages = { ...reglages, ...p };
  prevenir();
  await enregistrerReglagesDemo(reglages);
}

/** S'abonne aux changements de réglages (lance la lecture du téléphone au premier abonné). */
export function ecouterReglagesDemo(fn: () => void): Desabonner {
  ecouteurs.add(fn);
  void lancerLecture();
  return () => {
    ecouteurs.delete(fn);
  };
}

/**
 * Prend le pépin réservé, s'il y en a un, et l'efface : il n'arrive qu'une fois. Avec `acceptes`, seul un pépin de la
 * liste est pris (un « QR expiré » attend le prochain scan, il ne gâche pas une demande d'addition).
 */
export function consommerPepin(acceptes?: readonly PepinDemo[]): PepinDemo | null {
  const pepin = reglages.pepin;
  if (pepin === null || (acceptes && !acceptes.includes(pepin))) return null;
  reglages = { ...reglages, pepin: null };
  prevenir();
  enregistrerReglagesDemo(reglages).catch(() => {});
  return pepin;
}

/** Remet tous les réglages de démo à zéro et les efface du téléphone (« Tout effacer »). */
export async function oublierReglagesDemo(): Promise<void> {
  await lancerLecture();
  reglages = REGLAGES_DEMO_DEFAUT;
  prevenir();
  await effacerReglagesDemo();
}
