import { useSyncExternalStore } from "react";

import { enregistrerPreferencesFil, lirePreferencesFil, PREFERENCES_FIL_PAR_DEFAUT } from "~/stockage/preferences-fil";

// Un seul réglage pour tout le fil : couper le son d'une vidéo le coupe pour toutes, et le choix reste sur le téléphone.
// Gardé ici, hors de React : chaque lecteur s'y abonne, et seul un changement de son redessine les vidéos.
let sonCoupe = PREFERENCES_FIL_PAR_DEFAUT.sonCoupe;
let lectureLancee = false;
let changeAvantLecture = false;
const abonnes = new Set<() => void>();

function prevenirAbonnes() {
  abonnes.forEach((abonne) => abonne());
}

function sAbonner(abonne: () => void) {
  abonnes.add(abonne);
  // Le choix gardé sur le téléphone n'est lu qu'une fois, au premier lecteur ; muet en attendant
  if (!lectureLancee) {
    lectureLancee = true;
    lirePreferencesFil()
      .then(({ sonCoupe: lu }) => {
        if (changeAvantLecture || lu === sonCoupe) return;
        sonCoupe = lu;
        prevenirAbonnes();
      })
      .catch(() => {});
  }
  return () => {
    abonnes.delete(abonne);
  };
}

const lireSonCoupe = () => sonCoupe;

function basculerSon() {
  sonCoupe = !sonCoupe;
  changeAvantLecture = true;
  prevenirAbonnes();
  enregistrerPreferencesFil({ sonCoupe }).catch(() => {});
}

/** Le son des vidéos du fil : coupé par défaut, le même pour toutes les vidéos, gardé sur le téléphone. */
export function utiliserSonFil(): { sonCoupe: boolean; basculerSon: () => void } {
  const coupe = useSyncExternalStore(sAbonner, lireSonCoupe, lireSonCoupe);
  return { sonCoupe: coupe, basculerSon };
}
