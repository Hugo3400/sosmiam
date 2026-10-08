import type { ErreurApi } from "~/services/client-gestion.ts";

const MESSAGES: Record<string, string> = {
  reseau: "Le serveur ne répond pas. Vérifie ta connexion, ou l'état du serveur.",
  "non-autorise": "Le serveur ne reconnaît pas ce poste. A-t-il bien été autorisé ?",
  "horloge-decalee": "L'heure de ton PC est décalée de plus d'une minute : resynchronise-la dans les réglages de Windows.",
  "gestion-fermee": "La gestion est fermée sur le serveur (fichier d'accès absent ou mal protégé).",
  "trop-d-essais": "Trop d'essais ratés : le serveur fait une pause de quelques minutes.",
  "session-expiree": "Ta session s'est fermée : retape ton code.",
  "code-invalide": "Ce code ne marche pas (ou il a déjà servi). Attends le suivant et réessaie.",
  "champ-invalide": "Un champ ne va pas.",
  introuvable: "Introuvable : quelqu'un (toi ?) l'a peut-être supprimé.",
  "format-refuse": "Ce fichier n'est pas accepté : vidéo MP4, MOV ou WebM, image JPEG, PNG ou WebP.",
  "fichier-trop-lourd": "Fichier trop lourd : 95 Mo au plus pour une vidéo, 15 Mo pour une image.",
  "melange-video-photos": "Une publication, c'est soit une vidéo (et son affiche), soit des photos : pas les deux.",
  "trop-de-photos": "10 photos au plus par publication.",
  "processus-refuse": "Ce programme ne peut pas être relancé d'ici.",
  "fondateurs-complets": "Les 10 places de fondateur sont déjà prises.",
  "ambassadeur-non-actif": "On ne confie une mission qu'à un ambassadeur actif (validé et pas suspendu).",
  "bientot-disponible": "Pas encore possible : cette partie des comptes n'est pas encore branchée sur le serveur.",
};

/** Texte lisible pour une erreur de l'API. */
export function expliquerErreur(erreur: ErreurApi | null): string {
  if (!erreur) return "";
  return MESSAGES[erreur.code] ?? `Oups, le serveur a répondu « ${erreur.code} » (${erreur.statut || "pas de réponse"}).`;
}
