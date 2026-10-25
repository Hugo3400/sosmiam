// Les contenus que la modération juge (sans base de données : les contrôleurs s'en servent).
import type { ChiffrementSocial } from "../chiffrement-social.ts";
import type { ServicesCloche } from "../cloche-regles.ts";
import type { StockageMediasChat } from "../stockage-medias-chat.ts";

/** Les contenus sociaux de l'app (spécification sociale F.2), en plus des publications */
export const CIBLES_SOCIALES = ["commentaire", "message", "liste", "profil", "sortie", "groupe"] as const;
/** Retenus, ces contenus ne sont pas retirés mais remis par défaut (avatar, titre « Sortie », groupe sans titre) */
/** Décisions de la relecture des avis (masqués par l'équipe, contestables comme le social) */
export const CIBLES_AVIS = ["avis", "reponse-avis"] as const;
export const CIBLES_COMMUNAUTE = ["idee", "comment-idee", "miamis"] as const;
export const CIBLES_REMISES_PAR_DEFAUT = ["profil", "sortie", "groupe"] as const;
export const CIBLES_IMAGES_LIEU = ["image-lieu"] as const;

/** Ce que la modération sociale reçoit de demarrer.ts (les mêmes objets que la partie sociale de l'app) */
export type ModerationSociale = { chiffrement: ChiffrementSocial | null; medias: StockageMediasChat; cloche: ServicesCloche };
