// La cloche de l'app : les notifications DANS l'app, telles que l'API les rend. Le texte est écrit par l'app : l'API ne
// donne que le type, qui agit et sur quoi. Les types sont listés dans regles/cloche.ts (TYPES_CLOCHE).
import type { PersonneResume } from "./social.ts";

/**
 * « invitation-groupe » : quelqu'un t'invite à rejoindre un groupe (réponse de Hugo du 14/10/2026 : on entre dans un groupe
 * en acceptant, comme dans une sortie ; il remplace l'ancien « groupe-ajout »).
 */
export type TypeCloche =
  | "nouvel-abonne" | "demande-acceptee" | "bande-ajout" | "bande-acceptee" | "lien-renouvele" | "invitation-sortie"
  | "sortie-lieu-choisi" | "sortie-annulee" | "invitation-groupe" | "liste-coauteur" | "mention" | "reponse-commentaire"
  | "contenu-masque" | "contenu-retire" | "signalement-decide";

export type CibleCloche = "sortie" | "conversation" | "liste" | "publication" | "commentaire" | "signalement";

export type NotificationClocheApi = {
  id: string;
  type: TypeCloche;
  /** null : l'équipe SOS Miam */
  acteur: PersonneResume | null;
  date: string;
  cible: { type: CibleCloche; id: string } | null;
  detail: string | null;
  enRetour: boolean;
};

export type PageClocheApi = { notifications: NotificationClocheApi[]; vuesLe: string | null; suite: string | null };
