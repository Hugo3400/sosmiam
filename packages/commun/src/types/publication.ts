// Une publication du fil « Pour toi », telle que l'API la rend à l'app (GET /app/publications) : les médias sont des
// adresses (https://…/app/medias/<fichier>), que l'app passe telles quelles à ses lecteurs d'image et de vidéo.

/** Qui a publié : le lieu lui-même (seulement s'il est vérifié), ou un créateur (avec sa collaboration commerciale) */
export type AuteurPublication = { type: "lieu" } | { type: "createur"; pseudo: string; partenariat?: string };

/** Une vidéo (et l'image qui la montre avant qu'elle joue, si le lieu en a mis une), ou des photos dans l'ordre */
export type MediaPublicationApi = { type: "video"; video: string; affiche?: string } | { type: "photos"; photos: string[] };

export type PublicationApi = {
  /** En texte, comme la cible d'un signalement */
  id: string;
  lieuId: number;
  auteur: AuteurPublication;
  legende: string;
  /** Absent : publication sans média (le fil montre alors le dégradé du lieu) */
  media?: MediaPublicationApi;
  /** Média qui illustre le lieu sans y avoir été filmé (« Vidéo d'illustration ») */
  illustration: boolean;
  jaimes: number;
  commentaires: number;
  /** Date de mise en ligne (ISO 8601) */
  publieeLe: string;
};
