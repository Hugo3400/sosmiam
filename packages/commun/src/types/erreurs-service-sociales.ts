// Les erreurs de la partie sociale de l'API (potes, suivis, messagerie, sorties, listes, commentaires, signalements et
// décisions de la modération). À part de erreurs-service.ts, qui les reprend dans ErreurService ; chaque code a son texte
// dans contenus/messages-services-sociaux.ts. Le refus du filtre de mots garde le code commun « message-refuse ». Une
// contestation hors délai a son propre code, « contestation-hors-delai » (409) : le « delai-depasse » commun parle des
// réservations et des visites (« ce sera pour le prochain passage »), pas d'une décision de la modération.
// « chiffrement-indisponible » (503, « Coffre-fort fermé ») n'est pas encore ici : tests/client-http.test.ts:37 attend
// toujours qu'il devienne « erreur-serveur ». Le lot L2 l'ajoute, dans le même changement : ce fichier, son texte dans
// contenus/messages-services-sociaux.ts (B.13), tests/client-http.test.ts:37 (attendu : « chiffrement-indisponible »), et
// le retrait de « signalement-invalide » des EQUIVALENTS de client-api/client-http.ts.

export type ErreurServiceSociale =
  | "pseudo-requis"
  | "personne-inconnue"
  | "invitation-invalide"
  | "bande-pleine"
  | "trop-de-demandes-en-attente"
  | "demande-inconnue"
  | "pas-dans-la-bande"
  | "profil-prive"
  | "trop-d-abonnements"
  | "trop-de-blocages"
  | "conversation-inconnue"
  | "conversation-fermee"
  | "groupe-plein"
  | "reserve-aux-admins"
  | "reserve-a-l-auteur"
  | "reserve-a-l-organisateur"
  | "message-inconnu"
  | "media-expire"
  | "media-invalide"
  | "media-trop-lourd"
  | "format-refuse"
  | "trop-de-medias"
  | "sortie-inconnue"
  | "sortie-pleine"
  | "sortie-passee"
  | "vote-termine"
  | "max-propositions"
  | "trop-de-sorties"
  | "liste-inconnue"
  | "trop-de-listes"
  | "liste-pleine"
  | "trop-de-co-auteurs"
  | "invitation-inconnue"
  | "commentaire-inconnu"
  | "contenu-inconnu"
  | "signalement-invalide"
  | "geree-par-la-sortie"
  | "trop-de-masques"
  | "deja-examine"
  | "stockage-plein"
  | "decision-inconnue"
  | "deja-contestee"
  | "contestation-hors-delai";
