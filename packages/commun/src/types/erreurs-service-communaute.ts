// Les erreurs de l'espace communauté de l'API (/app/communaute : sorties des Miamis, « Qui est là ? », mon genre, boîte à
// idées). À part de erreurs-service.ts, qui les reprend dans ErreurService ; chaque code a son texte dans
// contenus/messages-services-communaute.ts. Les codes déjà connus de la partie sociale (sortie-inconnue, sortie-passee,
// reserve-a-l-organisateur, personne-inconnue, demande-inconnue, commentaire-inconnu, message-refuse…) gardent les leurs.

export type ErreurServiceCommunaute =
  | "public-reserve"
  | "trop-de-sorties-miamis"
  | "genre-trop-tot"
  | "presence-non-validee"
  | "presence-fermee"
  | "invisible-ici"
  | "ville-requise"
  | "idee-proche"
  | "idee-inconnue"
  | "idee-en-relecture";
