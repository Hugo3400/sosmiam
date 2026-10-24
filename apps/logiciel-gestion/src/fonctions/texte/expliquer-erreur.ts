import type { ErreurApi } from "~/services/client-gestion.ts";

const MESSAGES: Record<string, string> = {
  reseau: "Le serveur ne répond pas. Vérifie ta connexion, ou l'état du serveur.",
  "delai-depasse": "Le serveur met trop longtemps à répondre, alors on a arrêté d'attendre. L'action a peut-être été faite quand même : actualise avant de réessayer. Si ça recommence, regarde Maintenance.",
  "reponse-illisible": "La réponse du serveur est arrivée abîmée. Actualise ; si ça recommence, regarde Maintenance.",
  "non-autorise": "Le serveur ne reconnaît pas ce poste. A-t-il bien été autorisé ?",
  "horloge-decalee": "L'heure de ton PC est décalée de plus d'une minute : resynchronise-la dans les réglages de Windows.",
  "gestion-fermee": "La gestion est fermée sur le serveur (fichier d'accès absent ou mal protégé).",
  "trop-d-essais": "Trop d'essais ratés : le serveur fait une pause de quelques minutes.",
  "session-expiree": "Ta session s'est fermée : retape ton code.",
  "code-invalide": "Ce code ne marche pas (ou il a déjà servi). Attends le suivant et réessaie.",
  "champ-invalide": "Un champ ne va pas.",
  introuvable: "Introuvable : quelqu'un (toi ?) l'a peut-être supprimé.",
  "format-refuse": "Ce fichier n'est pas accepté : vidéo MP4 ou MOV, image JPEG ou PNG.",
  "nettoyage-impossible": "Impossible de retirer la position et les infos cachées de ce fichier, donc il n'est pas enregistré. Réexporte-le (MP4, JPEG ou PNG) et réessaie.",
  "fichier-trop-lourd": "Fichier trop lourd : 95 Mo au plus pour une vidéo, 15 Mo pour une image.",
  "melange-video-photos": "Une publication, c'est soit une vidéo (et son affiche), soit des photos : pas les deux.",
  "trop-de-photos": "10 photos au plus par publication.",
  "processus-refuse": "Ce programme ne peut pas être relancé d'ici.",
  "zone-complete": "Plus de place de fondateur dans cette ville (ou ce département) : une place se rouvre si un fondateur déménage ou quitte le programme.",
  "sans-zone": "Choisis d'abord la commune de la personne : sa ville (ou son département) donne ses places et son numéro.",
  "pas-fondateur-de-ville": "Le rôle d'ambassadeur de ville est réservé aux fondateurs d'une ville (pas d'un département).",
  "ambassadeur-non-actif": "On ne confie une mission qu'à un ambassadeur actif (validé et pas suspendu).",
  "bientot-disponible": "Pas encore possible : cette partie des comptes n'est pas encore branchée sur le serveur.",
  "envoi-absent": "L'envoi des mails n'est pas encore réglé sur le serveur : regarde l'onglet « Envois » de la newsletter.",
  "envoi-mal-protege": "Le fichier de la boîte mail est lisible par d'autres comptes du serveur : lance « chmod 600 » dessus (onglet « Envois »).",
  "envoi-incomplet": "Le fichier de la boîte mail est incomplet (serveur, adresse ou mot de passe) : regarde l'onglet « Envois ».",
  "envoi-refuse": "Le serveur mail a refusé l'envoi.",
  "envoi-en-cours": "Un envoi groupé est déjà en train de partir : attends qu'il soit fini, ou arrête-le dans « Envois ».",
  "synchro-impossible": "Impossible de synchroniser la boîte mail avant l'envoi (les désinscriptions doivent partir d'abord) : rien n'est parti.",
  "boite-absente": "La boîte bonjour@ n'est pas encore réglée sur le serveur (fichier de la boîte absent) : regarde Newsletter → Envois.",
  "boite-injoignable": "La boîte bonjour@ ne répond pas pour l'instant (serveur mail ou mot de passe d'application) : réessaie dans un moment.",
  "transition-interdite": "Cette visite n'est plus refusée : quelqu'un lui a peut-être déjà donné raison. Actualise.",
  "pas-contestee": "Cette visite n'est pas contestée.",
  "chiffrement-indisponible": "La clé des données des comptes n'est pas encore installée sur le serveur : nom et date de naissance sont illisibles pour l'instant.",
  "trop-jeune": "Moins de 18 ans : SOS Miam est réservé aux majeurs. La date n'est pas changée ; si c'est vrai, ce compte doit être supprimé.",
  "date-invalide": "Cette date n'existe pas, ou elle est dans le futur.",
  "minimale-trop-haute": "La version minimale ne peut pas dépasser la dernière version.",
  "aucun-destinataire": "Personne à qui envoyer : aucun destinataire coché ne fait partie de ce public.",
};

/** Texte lisible pour une erreur de l'API. */
export function expliquerErreur(erreur: ErreurApi | null): string {
  if (!erreur) return "";
  const message = MESSAGES[erreur.code] ?? `Oups, le serveur a répondu « ${erreur.code} » (${erreur.statut || "pas de réponse"}).`;
  return erreur.detail ? `${message} Détail : ${erreur.detail}` : message;
}
