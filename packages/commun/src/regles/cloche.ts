// Règles de la cloche de l'app (décidées le 8 et le 14 octobre 2026) : 16 types, gardés 90 jours, 200 au plus par compte ;
// les quatre types de la modération sont gardés 6 mois, hors de cette limite, pour pouvoir contester pendant 6 mois.
// « compte-limite » (15/10/2026) : le compte est limité par l'équipe, detail = le code du motif, cible « limitation ».
import type { TypeCloche } from "../types/cloche.ts";

export const TYPES_CLOCHE = [
  "nouvel-abonne",
  "demande-acceptee",
  "bande-ajout",
  "bande-acceptee",
  "lien-renouvele",
  "invitation-sortie",
  "sortie-lieu-choisi",
  "sortie-annulee",
  "invitation-groupe",
  "liste-coauteur",
  "mention",
  "reponse-commentaire",
  "contenu-masque",
  "contenu-retire",
  "signalement-decide",
  "compte-limite",
] as const satisfies readonly TypeCloche[];

export const DUREE_CLOCHE_JOURS = 90;
export const MAX_NOTIFICATIONS_CLOCHE = 200;

export const TYPES_CLOCHE_MODERATION = ["contenu-masque", "contenu-retire", "signalement-decide", "compte-limite"] as const satisfies readonly TypeCloche[];
export const DUREE_CLOCHE_MODERATION_JOURS = 183;
