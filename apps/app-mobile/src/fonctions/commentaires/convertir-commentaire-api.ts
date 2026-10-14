import type { Commentaire, CommentaireApi } from "@sos-miam/commun/types/commentaires";

/**
 * Un commentaire tel que l'API le rend (visite et compte connecté), au format des écrans : l'auteur par son identifiant
 * public (« lieu » pour la réponse du lieu, « » pour un compte supprimé), et ce que le serveur dit en plus dans `serveur`
 * (nombre de J'aime, le tien, « Commentaire supprimé », état vu par son auteur, mentions avec leur profil).
 */
export function convertirCommentaireApi(c: CommentaireApi, aimeParMoi: boolean): Commentaire {
  const personne = c.auteur.type === "personne" ? c.auteur.personne : null;
  return {
    id: c.id,
    publicationId: c.publicationId,
    auteur: c.auteur.type === "lieu" ? "lieu" : (personne?.id ?? ""),
    texte: c.texte,
    date: c.date,
    ...(c.modifieLe ? { modifieLe: c.modifieLe } : {}),
    jaimes: [],
    ...(c.reponseA ? { reponseA: c.reponseA } : {}),
    mentions: c.mentions.map((m) => m.pseudo),
    ...(c.etat === "masque-par-le-lieu" ? { masqueParLieu: true } : {}),
    serveur: { personne, nombreJaimes: c.jaimes, aimeParMoi, supprime: c.supprime, etat: c.etat ?? null, mentions: c.mentions },
  };
}
