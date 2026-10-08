import type { AudioPlayer } from "expo-audio";
import { useSyncExternalStore } from "react";

// Le son du chat entre potes, partagé par toutes les notes vocales et l'enregistreur, dans toute l'app :
// - une seule note joue à la fois (en lancer une met l'autre en pause) ;
// - rien ne joue pendant un enregistrement : le micro capterait la note, et sur iPhone, régler le son pour lire
//   (setAudioModeAsync sans enregistrement) arrêterait net l'enregistreur, qui perdrait la note en cours.

let noteQuiJoue: AudioPlayer | null = null;
let enregistrementEnCours = false;
const abonnes = new Set<() => void>();

const abonner = (prevenir: () => void) => {
  abonnes.add(prevenir);
  return () => {
    abonnes.delete(prevenir);
  };
};

/** Vrai pendant qu'une note vocale s'enregistre (micro qui s'échauffe compris), lu à l'instant (après une attente, par exemple). */
export function estEnregistrementEnCours(): boolean {
  return enregistrementEnCours;
}

/** Cette note commence à jouer : celle qui jouait déjà se met en pause. */
export function jouerNoteVocale(lecteur: AudioPlayer): void {
  if (noteQuiJoue && noteQuiJoue !== lecteur) {
    try {
      noteQuiJoue.pause();
    } catch {
      // Déjà libérée
    }
  }
  noteQuiJoue = lecteur;
}

/** Cette note n'existe plus (bulle quittée) : on l'oublie si c'était elle qui jouait. */
export function oublierNoteVocale(lecteur: AudioPlayer): void {
  if (noteQuiJoue === lecteur) noteQuiJoue = null;
}

/** Met en pause la note qui joue, s'il y en a une (enregistrement qui démarre, écran de discussion quitté ou recouvert). */
export function mettreEnPauseNoteQuiJoue(): void {
  try {
    noteQuiJoue?.pause();
  } catch {
    // Déjà libérée
  }
}

/** L'enregistreur s'ouvre (true) ou se ferme (false) : les notes vocales ne se lisent pas entre les deux. */
export function signalerEnregistrement(enCours: boolean): void {
  if (enregistrementEnCours === enCours) return;
  enregistrementEnCours = enCours;
  if (enCours) mettreEnPauseNoteQuiJoue();
  abonnes.forEach((prevenir) => prevenir());
}

/** Le son du chat vu d'une bulle : `enregistrementEnCours` est vrai pendant qu'une note s'enregistre (micro qui s'échauffe compris). */
export function utiliserAudioChat(): { enregistrementEnCours: boolean } {
  return { enregistrementEnCours: useSyncExternalStore(abonner, estEnregistrementEnCours, estEnregistrementEnCours) };
}
