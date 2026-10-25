/** Qui a écrit le contenu, tel qu'il s'appelait au moment du signalement ; null : compte supprimé (ou réponse du lieu) */
export type AuteurInstantane = { pseudo: string | null; prenom: string } | null;

/**
 * Le contenu signalé, tel qu'il était au moment du signalement, une forme par cible (spécification sociale A.7, F.2). Les
 * lieux restent des identifiants, jamais leurs noms : la modération les relit dans la base.
 */
export type ContenuSignale =
  | {
      cible: "commentaire";
      texte: string;
      mentions: { pseudo: string; id: string }[];
      publicationId: number;
      lieuId: number;
      /** Réponse du lieu de la publication (écrite par son gérant) */
      commeLieu: boolean;
      masqueParLieu: boolean;
      auteur: AuteurInstantane;
      date: Date;
    }
  | {
      cible: "message";
      type: string;
      /** Texte, ou petit mot d'un lieu envoyé ; null : photo, note vocale, ou texte illisible */
      texte: string | null;
      lieuId: number | null;
      /** Vrai si le texte n'a pas pu être déchiffré (clé changée sans rechiffrement) */
      illisible: boolean;
      media: { typeMime: string | null; taille: number | null; dureeSecondes: number | null } | null;
      conversation: { type: string; titre: string | null; emoji: string | null };
      auteur: AuteurInstantane;
      date: Date;
      gif?: { id: string; url: string } | null;
      lieux?: number[];
    }
  | { cible: "liste"; titre: string; emoji: string; description: string; visibilite: string; lieux: number[]; auteur: AuteurInstantane }
  | { cible: "profil"; pseudo: string | null; prenom: string; avatar: string | null }
  | { cible: "sortie"; titre: string; emoji: string; quand: Date; lieux: number[]; organisateur: AuteurInstantane }
  | { cible: "groupe"; titre: string | null; emoji: string | null; createur: AuteurInstantane }
  | { cible: "idee"; titre: string; detail: string; statut: string; auteur: AuteurInstantane; date: Date }
  | { cible: "comment-idee"; texte: string; ideeId: number; reponseA: number | null; auteur: AuteurInstantane; date: Date }
  | { cible: "miamis"; titre: string; description: string; quand: Date; lieuId: number; etiquettesLibres: string[]; organisateur: AuteurInstantane };

/** Les plafonds d'un instantané : il tient toujours dans signalements.instantane_chiffre (VarChar(6000)) une fois chiffré */
const MAX_TEXTE = 500;
const MAX_COURT = 160;
const MAX_LIEUX = 100;
const MAX_MENTIONS = 10;

const couper = (texte: string | null, max: number) => (texte === null ? null : [...texte].slice(0, max).join(""));
const auteur = (a: AuteurInstantane) => (a ? { pseudo: couper(a.pseudo, 40), prenom: couper(a.prenom, 60) } : null);

/**
 * Le JSON de l'instantané d'un contenu signalé (« v »: 1, la forme de ContenuSignale, dates en ISO), à chiffrer avec
 * chiffrerInstantane (sous-clé de la modération, contexte « signalement:<id> ») dans la transaction du signalement. Les
 * textes sont coupés à leur longueur permise : le plus gros (un message de 500 caractères) chiffré tient en 6 000.
 */
export function construireInstantane(contenu: ContenuSignale): string {
  switch (contenu.cible) {
    case "commentaire":
      return JSON.stringify({
        v: 1, cible: contenu.cible, texte: couper(contenu.texte, MAX_TEXTE), mentions: contenu.mentions.slice(0, MAX_MENTIONS),
        publicationId: contenu.publicationId, lieuId: contenu.lieuId, commeLieu: contenu.commeLieu, masqueParLieu: contenu.masqueParLieu,
        auteur: auteur(contenu.auteur), date: contenu.date.toISOString(),
      });
    case "message":
      return JSON.stringify({
        v: 1, cible: contenu.cible, type: contenu.type, texte: couper(contenu.texte, MAX_TEXTE), lieuId: contenu.lieuId, illisible: contenu.illisible,
        media: contenu.media, conversation: { ...contenu.conversation, titre: couper(contenu.conversation.titre, MAX_COURT) },
        auteur: auteur(contenu.auteur), date: contenu.date.toISOString(), ...(contenu.gif ? { gif: contenu.gif } : {}),
        ...(contenu.lieux ? { lieux: contenu.lieux.slice(0, MAX_LIEUX) } : {}),
      });
    case "liste":
      return JSON.stringify({
        v: 1, cible: contenu.cible, titre: couper(contenu.titre, MAX_COURT), emoji: contenu.emoji, description: couper(contenu.description, MAX_COURT),
        visibilite: contenu.visibilite, lieux: contenu.lieux.slice(0, MAX_LIEUX), auteur: auteur(contenu.auteur),
      });
    case "profil":
      return JSON.stringify({ v: 1, cible: contenu.cible, pseudo: couper(contenu.pseudo, 40), prenom: couper(contenu.prenom, 60), avatar: couper(contenu.avatar, 16) });
    case "sortie":
      return JSON.stringify({
        v: 1, cible: contenu.cible, titre: couper(contenu.titre, MAX_COURT), emoji: contenu.emoji, quand: contenu.quand.toISOString(),
        lieux: contenu.lieux.slice(0, MAX_LIEUX), organisateur: auteur(contenu.organisateur),
      });
    case "groupe":
      return JSON.stringify({ v: 1, cible: contenu.cible, titre: couper(contenu.titre, MAX_COURT), emoji: contenu.emoji, createur: auteur(contenu.createur) });
    case "idee":
      return JSON.stringify({
        v: 1, cible: contenu.cible, titre: couper(contenu.titre, MAX_COURT), detail: couper(contenu.detail, MAX_TEXTE), statut: contenu.statut,
        auteur: auteur(contenu.auteur), date: contenu.date.toISOString(),
      });
    case "comment-idee":
      return JSON.stringify({
        v: 1, cible: contenu.cible, texte: couper(contenu.texte, MAX_TEXTE), ideeId: contenu.ideeId, reponseA: contenu.reponseA, auteur: auteur(contenu.auteur),
        date: contenu.date.toISOString(),
      });
    case "miamis":
      return JSON.stringify({
        v: 1, cible: contenu.cible, titre: couper(contenu.titre, MAX_COURT), description: couper(contenu.description, MAX_TEXTE), quand: contenu.quand.toISOString(),
        lieuId: contenu.lieuId, etiquettesLibres: contenu.etiquettesLibres.slice(0, 5).map((e) => couper(e, 40)), organisateur: auteur(contenu.organisateur),
      });
  }
}
