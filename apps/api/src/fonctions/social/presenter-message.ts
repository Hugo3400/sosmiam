import type { CodeReaction, MediaMessageApi, MessageApi } from "../../../../../packages/commun/src/types/messagerie.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";

/** Une ligne de messages_conversations (le texte reste chiffré : le service le déchiffre avant de présenter) */
export type LigneMessage = {
  id: number;
  conversationId: number;
  /** null : compte supprimé (« Compte supprimé ») */
  auteurId: number | null;
  type: "texte" | "lieu" | "photo" | "vocal";
  idClient: string;
  texteChiffre: string | null;
  fichier: string | null;
  typeMime: string | null;
  taille: number | null;
  largeur: number | null;
  hauteur: number | null;
  dureeSecondes: number | null;
  mediaExpireLe: Date | null;
  creeLe: Date;
  supprimeLe: Date | null;
  suspenduLe: Date | null;
  retireLe: Date | null;
};

/** Ce que dit un message une fois déchiffré : son texte (ou le mot d'un lieu envoyé) et son lieu */
export type ContenuMessage = { texte: string | null; lieuId: number | null };

const RIEN: ContenuMessage = { texte: null, lieuId: null };

/** La photo ou la note vocale d'un message visible : « expire » quand le fichier est parti du serveur (90 jours) */
function presenterMedia(l: LigneMessage, maintenant: Date): MediaMessageApi | null {
  if ((l.type !== "photo" && l.type !== "vocal") || (l.typeMime !== "image/jpeg" && l.typeMime !== "audio/mp4")) return null;
  const expireLe = l.mediaExpireLe ?? l.creeLe;
  return {
    etat: l.fichier && expireLe.getTime() > maintenant.getTime() ? "disponible" : "expire",
    typeMime: l.typeMime,
    taille: l.taille ?? 0,
    largeur: l.largeur,
    hauteur: l.hauteur,
    dureeSecondes: l.dureeSecondes,
    expireLe: expireLe.toISOString(),
  };
}

/**
 * Un message tel que l'app le lit (B.11). États : « supprime » (par son auteur), « retire » (par la modération), « masque »
 * (suspendu en attendant la modération), « illisible » (le chiffré ne se relit pas), sinon « visible ». Hors de « visible » :
 * ni texte, ni lieu, ni média, ni réactions. Les id sont des textes ; l'auteur est null pour un compte supprimé.
 */
export function presenterMessage(
  l: LigneMessage,
  o: { auteur: PersonneResume | null; contenu: ContenuMessage | "illisible"; reactions: Partial<Record<CodeReaction, string[]>>; maintenant: Date },
): MessageApi {
  const etat: MessageApi["etat"] = l.supprimeLe ? "supprime" : l.retireLe ? "retire" : l.suspenduLe ? "masque" : o.contenu === "illisible" ? "illisible" : "visible";
  const visible = etat === "visible";
  const contenu = visible && o.contenu !== "illisible" ? o.contenu : RIEN;
  return {
    id: String(l.id),
    idClient: l.idClient,
    auteur: o.auteur,
    date: l.creeLe.toISOString(),
    type: l.type,
    texte: contenu.texte,
    lieuId: contenu.lieuId,
    media: visible ? presenterMedia(l, o.maintenant) : null,
    reactions: visible ? o.reactions : {},
    etat,
  };
}
